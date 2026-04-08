import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClineSetupSection } from "@/components/shared/cline-setup-section";
import type { UseRuntimeSettingsClineControllerResult } from "@/hooks/use-runtime-settings-cline-controller";

vi.mock("@/runtime/runtime-config-query", () => ({
	openFileOnHost: vi.fn(),
}));

function findButtonByText(container: ParentNode, text: string): HTMLButtonElement | null {
	return (Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.trim() === text) ??
		null) as HTMLButtonElement | null;
}

function setInputValue(input: HTMLInputElement, value: string): void {
	const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
	descriptor?.set?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

function createControllerStub(
	overrides: Partial<UseRuntimeSettingsClineControllerResult> = {},
): UseRuntimeSettingsClineControllerResult {
	return {
		currentProviderSettings: {
			providerId: "my-provider",
			modelId: "qwen2.5-coder:32b",
			baseUrl: "http://localhost:8000/v1",
			timeoutMs: 45_000,
			reasoningEffort: null,
			apiKeyConfigured: true,
			oauthProvider: null,
			oauthAccessTokenConfigured: false,
			oauthRefreshTokenConfigured: false,
			oauthAccountId: null,
			oauthExpiresAt: null,
		},
		providerId: "my-provider",
		setProviderId: () => undefined,
		modelId: "qwen2.5-coder:32b",
		setModelId: () => undefined,
		apiKey: "",
		setApiKey: () => undefined,
		baseUrl: "http://localhost:8000/v1",
		setBaseUrl: () => undefined,
		region: "",
		setRegion: () => undefined,
		reasoningEffort: "",
		setReasoningEffort: () => undefined,
		awsAccessKey: "",
		setAwsAccessKey: () => undefined,
		awsSecretKey: "",
		setAwsSecretKey: () => undefined,
		awsSessionToken: "",
		setAwsSessionToken: () => undefined,
		awsRegion: "",
		setAwsRegion: () => undefined,
		awsProfile: "",
		setAwsProfile: () => undefined,
		awsAuthentication: "",
		setAwsAuthentication: () => undefined,
		awsEndpoint: "",
		setAwsEndpoint: () => undefined,
		gcpProjectId: "",
		setGcpProjectId: () => undefined,
		gcpRegion: "",
		setGcpRegion: () => undefined,
		providerCatalog: [
			{
				id: "my-provider",
				name: "My Provider",
				oauthSupported: false,
				enabled: true,
				defaultModelId: "qwen2.5-coder:32b",
				baseUrl: "http://localhost:8000/v1",
				supportsBaseUrl: true,
			},
		],
		providerModels: [{ id: "qwen2.5-coder:32b", name: "Qwen 2.5 Coder 32B" }],
		isLoadingProviderCatalog: false,
		isLoadingProviderModels: false,
		isRunningOauthLogin: false,
		normalizedProviderId: "my-provider",
		managedOauthProvider: null,
		isOauthProviderSelected: false,
		apiKeyConfigured: true,
		oauthConfigured: false,
		oauthAccountId: "",
		oauthExpiresAt: "",
		selectedModelSupportsReasoningEffort: false,
		hasUnsavedChanges: false,
		saveProviderSettings: async () => ({ ok: true }),
		addCustomProvider: async () => ({ ok: true }),
		updateCustomProvider: async () => ({ ok: true }),
		runOauthLogin: async () => ({ ok: true }),
		...overrides,
	};
}

describe("ClineSetupSection", () => {
	let container: HTMLDivElement;
	let root: Root;
	let previousActEnvironment: boolean | undefined;

	beforeEach(() => {
		previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
			.IS_REACT_ACT_ENVIRONMENT;
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
		document.body.innerHTML = "";
		if (previousActEnvironment === undefined) {
			delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
		} else {
			(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
				previousActEnvironment;
		}
	});

	it("prefills the edit dialog timeout from saved custom provider settings", async () => {
		const updateCustomProvider = vi.fn(async () => ({ ok: true }));
		const controller = createControllerStub({ updateCustomProvider });

		await act(async () => {
			root.render(
				<ClineSetupSection controller={controller} controlsDisabled={false} showHeading={false} showMcpSettings={false} />,
			);
		});

		const editButton = findButtonByText(document.body, "Edit");
		expect(editButton).toBeInstanceOf(HTMLButtonElement);

		await act(async () => {
			editButton?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
			editButton?.click();
		});

		const timeoutInput = Array.from(document.body.querySelectorAll("input")).find(
			(input) => input.placeholder === "30000",
		) as HTMLInputElement | undefined;
		expect(timeoutInput?.value).toBe("45000");

		await act(async () => {
			if (!timeoutInput) {
				return;
			}
			setInputValue(timeoutInput, "60000");
		});

		const updateButton = findButtonByText(document.body, "Update provider");
		expect(updateButton).toBeInstanceOf(HTMLButtonElement);

		await act(async () => {
			updateButton?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
			updateButton?.click();
		});

		expect(updateCustomProvider).toHaveBeenCalledWith(
			expect.objectContaining({
				providerId: "my-provider",
				timeoutMs: 60_000,
			}),
		);
	});
});