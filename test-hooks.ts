/**
 * OpenClaw Hooks Test Suite
 * Tests all hooks with mock events to verify behavior before VPS deployment.
 * 
 * Run: npx tsx test-hooks.ts
 */

import routerGuardHandler from "./hooks/router-guard/handler.js";
import billingTrackerHandler from "./hooks/billing-tracker/handler.js";
import secretGuardHandler from "./hooks/secret-guard/handler.js";

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
    if (condition) {
        console.log(`  ✅ ${message}`);
        testsPassed++;
    } else {
        console.log(`  ❌ ${message}`);
        testsFailed++;
    }
}

function createMockEvent(overrides: any = {}): any {
    return {
        type: "agent",
        action: "bootstrap",
        sessionKey: "agent:main:test",
        timestamp: new Date(),
        messages: [],
        context: {
            senderId: "+905357874261",
            commandSource: "whatsapp",
            workspaceDir: process.cwd(),
            bootstrapFiles: [
                { path: "SOUL.md", content: "# Main SOUL" }
            ],
            cfg: {},
            response: {
                content: "Test response",
                model: "haiku",
                usage: { input_tokens: 100, output_tokens: 50 }
            },
            ...overrides.context
        },
        ...overrides
    };
}

// ============================================
// Router Guard Tests
// ============================================
async function testRouterGuard(): Promise<void> {
    console.log("\n🛡️  ROUTER GUARD TESTS\n");

    // Test 1: Block non-Turkey number
    console.log("Test 1: Block non-+90 number");
    const event1 = createMockEvent({
        context: { senderId: "+1234567890", commandSource: "whatsapp", bootstrapFiles: [{ path: "test", content: "x" }] }
    });
    await routerGuardHandler(event1);
    assert(event1.context.bootstrapFiles.length === 0, "bootstrapFiles should be cleared");

    // Test 2: Allow Turkey admin number
    console.log("\nTest 2: Allow +90 admin number");
    const event2 = createMockEvent({
        context: {
            senderId: "+905357874261",
            commandSource: "whatsapp",
            workspaceDir: process.cwd(),
            bootstrapFiles: [{ path: "SOUL.md", content: "# Main" }]
        }
    });
    await routerGuardHandler(event2);
    assert(event2.context.bootstrapFiles.length > 0, "bootstrapFiles should NOT be cleared for admin");

    // Test 3: Unknown +90 gets guest bootstrap
    console.log("\nTest 3: Unknown +90 gets guest bootstrap");
    const event3 = createMockEvent({
        context: {
            senderId: "+905551234567",
            commandSource: "whatsapp",
            workspaceDir: process.cwd(),
            bootstrapFiles: [{ path: "SOUL.md", content: "# Main SOUL" }]
        }
    });
    await routerGuardHandler(event3);
    const hasGuestMarker = event3.context.bootstrapFiles.some(
        (f: any) => f.path === "GUEST_MODE.md"
    );
    assert(hasGuestMarker, "Guest mode marker should be injected");

    // Test 4: Skip non-WhatsApp channels
    console.log("\nTest 4: Skip non-WhatsApp channels");
    const event4 = createMockEvent({
        context: { senderId: "+1234567890", commandSource: "telegram", bootstrapFiles: [{ path: "test", content: "x" }] }
    });
    await routerGuardHandler(event4);
    assert(event4.context.bootstrapFiles.length === 1, "Telegram messages should be skipped (not filtered)");
}

// ============================================
// Billing Tracker Tests
// ============================================
async function testBillingTracker(): Promise<void> {
    console.log("\n💰 BILLING TRACKER TESTS\n");

    // Test 1: Log token usage
    console.log("Test 1: Log token usage for response");
    const event1 = createMockEvent({
        action: "response",
        context: {
            senderId: "+905357874261",
            response: {
                content: "Test",
                model: "haiku",
                usage: { input_tokens: 1000, output_tokens: 500 }
            }
        }
    });

    // This should log without error
    let noError = true;
    try {
        await billingTrackerHandler(event1);
    } catch (e) {
        noError = false;
        console.log("Error:", e);
    }
    assert(noError, "Should log usage without error");

    // Test 2: Different model pricing
    console.log("\nTest 2: Sonnet model pricing");
    const event2 = createMockEvent({
        action: "response",
        context: {
            senderId: "+905357874261",
            response: {
                content: "Test",
                model: "claude-3-5-sonnet",
                usage: { input_tokens: 1000, output_tokens: 500 }
            }
        }
    });

    try {
        await billingTrackerHandler(event2);
        noError = true;
    } catch {
        noError = false;
    }
    assert(noError, "Should handle sonnet model pricing");
}

// ============================================
// Secret Guard Tests
// ============================================
async function testSecretGuard(): Promise<void> {
    console.log("\n🔒 SECRET GUARD TESTS\n");

    // Test 1: Detect and redact Anthropic key
    console.log("Test 1: Redact Anthropic API key");
    const event1 = createMockEvent({
        action: "response",
        context: {
            response: {
                content: "Here is your key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890abcd"
            }
        }
    });
    await secretGuardHandler(event1);
    assert(
        !event1.context.response.content.includes("sk-ant-"),
        "Anthropic key should be redacted"
    );
    assert(
        event1.context.response.content.includes("[REDACTED]"),
        "Should contain [REDACTED] placeholder"
    );

    // Test 2: Detect GitHub PAT
    console.log("\nTest 2: Redact GitHub PAT");
    const event2 = createMockEvent({
        action: "response",
        context: {
            response: {
                content: "GitHub token: ghp_1234567890abcdefghijklmnopqrstuvwxyz"
            }
        }
    });
    await secretGuardHandler(event2);
    assert(
        !event2.context.response.content.includes("ghp_"),
        "GitHub PAT should be redacted"
    );

    // Test 3: Clean response (no secrets)
    console.log("\nTest 3: Clean response unchanged");
    const originalContent = "This is a clean response with no secrets.";
    const event3 = createMockEvent({
        action: "response",
        context: {
            response: {
                content: originalContent
            }
        }
    });
    await secretGuardHandler(event3);
    assert(
        event3.context.response.content === originalContent,
        "Clean response should be unchanged"
    );

    // Test 4: Multiple secrets in one response
    console.log("\nTest 4: Multiple secrets");
    const event4 = createMockEvent({
        action: "response",
        context: {
            response: {
                content: "OpenAI: sk-proj-abcdefghijklmnopqrstuvwxyz123456, Google: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            }
        }
    });
    await secretGuardHandler(event4);
    const redactedCount = (event4.context.response.content.match(/\[REDACTED\]/g) || []).length;
    assert(redactedCount === 2, `Should redact 2 secrets (found ${redactedCount})`);
}

// ============================================
// Run All Tests
// ============================================
async function runTests(): Promise<void> {
    console.log("═══════════════════════════════════════════");
    console.log("  OpenClaw Extensions - Hook Test Suite");
    console.log("═══════════════════════════════════════════");

    await testRouterGuard();
    await testBillingTracker();
    await testSecretGuard();

    console.log("\n═══════════════════════════════════════════");
    console.log(`  RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log("═══════════════════════════════════════════\n");

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
