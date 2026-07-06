import { execFileSync } from "node:child_process";

function runClipboardCommand(command: string, args: readonly string[]): string | undefined {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			timeout: 2000,
		}).replace(/\r\n/g, "\n");
	} catch {
		return undefined;
	}
}

export function readSystemClipboardText(): string | undefined {
	if (process.platform === "darwin") return runClipboardCommand("pbpaste", []);
	if (process.platform === "win32") {
		return runClipboardCommand("powershell", ["-NoProfile", "-Command", "Get-Clipboard -Raw"]);
	}
	if (process.env.TERMUX_VERSION) {
		const text = runClipboardCommand("termux-clipboard-get", []);
		if (text !== undefined) return text;
	}
	for (const [command, args] of [
		["wl-paste", ["-n"]],
		["xclip", ["-selection", "clipboard", "-o"]],
		["xsel", ["--clipboard", "--output"]],
	] as const) {
		const text = runClipboardCommand(command, args);
		if (text !== undefined) return text;
	}
	return undefined;
}
