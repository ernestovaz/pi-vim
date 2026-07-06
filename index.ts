import { copyToClipboard, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { formatTokens, sanitizeStatusText } from "./src/utils.ts";
import { readSystemClipboardText } from "./src/clipboard.ts";
import { VimModeEditor, type Mode } from "./src/editor.ts";

export default function (pi: ExtensionAPI) {
	let mode: Mode = "insert";
	let pendingStatus = "";
	let enabled = true;

	const applyVimMode = (ctx: ExtensionContext): void => {
		mode = "insert";
		pendingStatus = "";

		if (!enabled) {
			ctx.ui.setFooter(undefined);
			ctx.ui.setEditorComponent(undefined);
			return;
		}

		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsubscribe = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsubscribe,
				invalidate() {},
				render(width: number): string[] {
					let totalInput = 0;
					let totalOutput = 0;
					let totalCacheRead = 0;
					let totalCacheWrite = 0;
					let totalCost = 0;

					for (const entry of ctx.sessionManager.getEntries()) {
						if (entry.type === "message" && entry.message.role === "assistant") {
							totalInput += entry.message.usage.input;
							totalOutput += entry.message.usage.output;
							totalCacheRead += entry.message.usage.cacheRead;
							totalCacheWrite += entry.message.usage.cacheWrite;
							totalCost += entry.message.usage.cost.total;
						}
					}

					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextPercentValue = contextUsage?.percent ?? 0;
					const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";

					let pwd = ctx.sessionManager.getCwd();
					const home = process.env.HOME || process.env.USERPROFILE;
					if (home && pwd.startsWith(home)) {
						pwd = `~${pwd.slice(home.length)}`;
					}

					const branch = footerData.getGitBranch();
					if (branch) pwd = `${pwd} (${branch})`;

					const sessionName = ctx.sessionManager.getSessionName();
					if (sessionName) pwd = `${pwd} • ${sessionName}`;

					const prefix =
						mode === "insert"
							? theme.fg("muted", "-- INSERT -- ")
							: mode === "replace"
								? theme.fg("muted", "-- REPLACE -- ")
								: mode === "visual"
									? theme.fg("accent", "-- VISUAL -- ")
									: mode === "visual-line"
										? theme.fg("accent", "-- VISUAL LINE -- ")
										: "";
					const pwdLine = truncateToWidth(prefix + theme.fg("dim", pwd), width, theme.fg("dim", "..."));

					const statsParts: string[] = [];
					if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
					if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
					if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
					if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);

					const usingSubscription = ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false;
					if (totalCost || usingSubscription) {
						statsParts.push(`$${totalCost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
					}

					const contextPercentDisplay =
						contextPercent === "?" ? `?/${formatTokens(contextWindow)}` : `${contextPercent}%/${formatTokens(contextWindow)}`;
					const contextPart =
						contextPercentValue > 90
							? theme.fg("error", contextPercentDisplay)
							: contextPercentValue > 70
								? theme.fg("warning", contextPercentDisplay)
								: contextPercentDisplay;
					statsParts.push(contextPart);

					let statsLeft = statsParts.join(" ");
					let statsLeftWidth = visibleWidth(statsLeft);
					if (statsLeftWidth > width) {
						statsLeft = truncateToWidth(statsLeft, width, "...");
						statsLeftWidth = visibleWidth(statsLeft);
					}

					const modelName = ctx.model?.id || "no-model";
					const thinkingLevel = pi.getThinkingLevel();
					let modelRightSide =
						ctx.model?.reasoning && thinkingLevel !== "off"
							? `${modelName} • ${thinkingLevel}`
							: ctx.model?.reasoning
								? `${modelName} • thinking off`
								: modelName;

					if (footerData.getAvailableProviderCount() > 1 && ctx.model) {
						const withProvider = `(${ctx.model.provider}) ${modelRightSide}`;
						if (statsLeftWidth + 2 + visibleWidth(withProvider) <= width) {
							modelRightSide = withProvider;
						}
					}
					const pendingPrefix = pendingStatus ? `${pendingStatus}..` : "";
					const modelWidth = visibleWidth(modelRightSide);
					const minGap = statsLeftWidth > 0 ? 2 : 0;
					const modelStart = Math.max(statsLeftWidth + minGap, width - modelWidth);
					const beforeModelWidth = Math.max(0, modelStart - statsLeftWidth);
					let beforeModel = " ".repeat(beforeModelWidth);
					if (pendingPrefix) {
						const pendingWithSpace = `${pendingPrefix} `;
						const pendingWidth = visibleWidth(pendingWithSpace);
						if (pendingWidth <= beforeModelWidth) {
							beforeModel = `${" ".repeat(beforeModelWidth - pendingWidth)}${pendingWithSpace}`;
						}
					}
					const statsLine = truncateToWidth(`${statsLeft}${beforeModel}${modelRightSide}`, width, "");

					const dimStatsLeft = theme.fg("dim", statsLeft);
					const middle = statsLine.slice(statsLeft.length, statsLeft.length + beforeModel.length);
					const right = statsLine.slice(statsLeft.length + beforeModel.length);
					const coloredMiddle = pendingPrefix && middle.includes(`${pendingPrefix} `)
						? theme.fg("dim", middle.slice(0, middle.indexOf(`${pendingPrefix} `))) + theme.fg("muted", `${pendingPrefix} `)
						: theme.fg("dim", middle);
					const lines = [pwdLine, dimStatsLeft + coloredMiddle + theme.fg("dim", right)];

					const extensionStatuses = footerData.getExtensionStatuses();
					if (extensionStatuses.size > 0) {
						const statusLine = Array.from(extensionStatuses.entries())
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([, text]) => sanitizeStatusText(text))
							.join(" ");
						lines.push(truncateToWidth(statusLine, width, theme.fg("dim", "...")));
					}

					return lines;
				},
			};
		});

		ctx.ui.setEditorComponent(
			(tui, theme, keybindings) =>
				new VimModeEditor(
					tui,
					theme,
					keybindings,
					(nextMode, nextPending) => {
						mode = nextMode;
						pendingStatus = nextPending;
					},
					(text) => {
						void copyToClipboard(text).catch(() => {});
					},
					() => readSystemClipboardText(),
				),
		);
	};

	pi.registerCommand("vim-mode", {
		description: "Toggle vim mode",
		handler: async (_args, ctx) => {
			enabled = !enabled;
			applyVimMode(ctx);
			ctx.ui.notify(`Vim mode ${enabled ? "enabled" : "disabled"}.`, "info");
		},
	});

	pi.on("session_start", (_event, ctx) => {
		applyVimMode(ctx);
	});
}
