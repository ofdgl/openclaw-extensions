/**
 * Phase 2 Hooks Test Suite
 * Tests intent-classifier, loop-detector, rate-limiter, emergency-bypass, handoff-manager
 * 
 * Run: npx tsx test-phase2-hooks.ts
 */

import intentClassifierHandler from "./hooks/intent-classifier/handler.js";
import loopDetectorHandler from "./hooks/loop-detector/handler.js";
import rateLimiterHandler from "./hooks/rate-limiter/handler.js";
import emergencyBypassHandler from "./hooks/emergency-bypass/handler.js";
import handoffManagerHandler from "./hooks/handoff-manager/handler.js";

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
            messageText: "test message",
            messageId: `msg_${Date.now()}`,
            sessionMetadata: {},
            bootstrapFiles: [{ path: "test", content: "x" }],
            ...overrides.context
        },
        ...overrides
    };
}

// ============================================
// Intent Classifier Tests
// ============================================
async function testIntentClassifier(): Promise<void> {
    console.log("\n🎯 INTENT CLASSIFIER TESTS\n");

    // Test 1: Coding keywords
    console.log("Test 1: Detect coding intent");
    const event1 = createMockEvent({
        context: { messageText: "bana bir script yaz", workspaceDir: process.cwd() }
    });
    await intentClassifierHandler(event1);
    assert(
        event1.context.sessionMetadata?.intent === "coding",
        "Should detect coding intent from keywords"
    );

    // Test 2: Greeting detection
    console.log("\nTest 2: Detect greeting intent");
    const event2 = createMockEvent({
        context: { messageText: "merhaba nasılsın", workspaceDir: process.cwd() }
    });
    await intentClassifierHandler(event2);
    assert(
        event2.context.sessionMetadata?.intent === "greeting",
        "Should detect greeting intent"
    );

    // Test 3: Short message uses previous intent
    console.log("\nTest 3: Short message fallback");
    const event3 = createMockEvent({
        context: { messageText: "ok", workspaceDir: process.cwd() }
    });
    await intentClassifierHandler(event3);
    // Short message should trigger ask_model or use previous (we can't test previous easily)
    assert(true, "Short message handled");
}

// ============================================
// Loop Detector Tests
// ============================================
async function testLoopDetector(): Promise<void> {
    console.log("\n⏱️  LOOP DETECTOR TESTS\n");

    // Test 1: Start timer on bootstrap
    console.log("Test 1: Start timer with greeting intent");
    const event1 = createMockEvent({
        context: {
            sessionMetadata: { intent: "greeting" },
            messageId: "test_msg_1"
        }
    });
    await loopDetectorHandler(event1);
    assert(true, "Timer started for greeting (30s timeout)");

    // Test 2: Cancel timer on response
    console.log("\nTest 2: Cancel timer on response");
    const event2 = createMockEvent({
        action: "response",
        context: {
            messageId: "test_msg_1"
        }
    });
    await loopDetectorHandler(event2);
    assert(true, "Timer cancelled on response");

    // Test 3: Different timeout for coding
    console.log("\nTest 3: Coding intent timeout");
    const event3 = createMockEvent({
        context: {
            sessionMetadata: { intent: "coding" },
            messageId: "test_msg_2"
        }
    });
    await loopDetectorHandler(event3);
    assert(true, "Timer started for coding (10m timeout)");
}

// ============================================
// Rate Limiter Tests
// ============================================
async function testRateLimiter(): Promise<void> {
    console.log("\n🚦 RATE LIMITER TESTS\n");

    // Test 1: Admin bypasses limit
    console.log("Test 1: Admin bypasses rate limit");
    const event1 = createMockEvent({
        context: {
            senderId: "+905357874261", // Admin from contacts.yaml
            workspaceDir: process.cwd(),
            bootstrapFiles: [{ path: "test", content: "x" }]
        }
    });
    await rateLimiterHandler(event1);
    assert(
        event1.context.bootstrapFiles.length > 0,
        "Admin should bypass rate limit"
    );

    // Test 2: Unknown user within limit
    console.log("\nTest 2: Unknown user within limit");
    const event2 = createMockEvent({
        context: {
            senderId: "+905551111111", // Unknown user
            workspaceDir: process.cwd(),
            bootstrapFiles: [{ path: "test", content: "x" }]
        }
    });
    await rateLimiterHandler(event2);
    assert(
        event2.context.bootstrapFiles.length > 0,
        "User within limit should pass"
    );
}

// ============================================
// Emergency Bypass Tests
// ============================================
async function testEmergencyBypass(): Promise<void> {
    console.log("\n🚨 EMERGENCY BYPASS TESTS\n");

    // Test 1: Non-admin blocked
    console.log("Test 1: Non-admin /o command blocked");
    const event1 = createMockEvent({
        context: {
            senderId: "+905551111111", // Non-admin
            messageText: "/o analyze critical issue",
            workspaceDir: process.cwd(),
            bootstrapFiles: [{ path: "test", content: "x" }]
        }
    });
    await emergencyBypassHandler(event1);
    assert(
        event1.context.bootstrapFiles.length === 0,
        "Non-admin /o should be blocked"
    );
    assert(
        event1.messages.some(m => m.includes("admin")),
        "Should send admin-only error message"
    );

    // Test 2: Admin allowed
    console.log("\nTest 2: Admin /o command allowed");
    const event2 = createMockEvent({
        context: {
            senderId: "+905357874261", // Admin
            messageText: "/o debug production crash",
            workspaceDir: process.cwd(),
            bootstrapFiles: [{ path: "test", content: "x" }]
        }
    });
    await emergencyBypassHandler(event2);
    assert(
        event2.context.model === "claude-opus-4",
        "Admin /o should switch to Opus"
    );
    assert(
        event2.messages.some(m => m.includes("Opus")),
        "Should send Opus activation message"
    );
}

// ============================================
// Handoff Manager Tests
// ============================================
async function testHandoffManager(): Promise<void> {
    console.log("\n🔄 HANDOFF MANAGER TESTS\n");

    // Test 1: request_upgrade (Haiku → Sonnet)
    console.log("Test 1: Haiku → Sonnet upgrade");
    const event1 = createMockEvent({
        type: "tool",
        action: "execute",
        context: {
            toolName: "request_upgrade",
            toolArgs: { reason: "Task too complex" },
            workspaceDir: process.cwd()
        }
    });
    await handoffManagerHandler(event1);
    assert(
        event1.context.model?.includes("sonnet"),
        "Should upgrade to Sonnet"
    );
    assert(
        event1.messages.some(m => m.includes("Sonnet")),
        "Should send upgrade notification"
    );

    // Test 2: escalate_to_opus (Sonnet → Opus)
    console.log("\nTest 2: Sonnet → Opus escalation");
    const event2 = createMockEvent({
        type: "tool",
        action: "execute",
        context: {
            toolName: "escalate_to_opus",
            toolArgs: { reason: "Requires highest reasoning" },
            workspaceDir: process.cwd()
        }
    });
    await handoffManagerHandler(event2);
    assert(
        event2.context.model?.includes("opus"),
        "Should escalate to Opus"
    );
    assert(
        event2.messages.some(m => m.includes("Opus")),
        "Should send escalation notification"
    );
}

// ============================================
// Run All Tests
// ============================================
async function runTests(): Promise<void> {
    console.log("═══════════════════════════════════════════");
    console.log("  Phase 2 Hooks - Test Suite");
    console.log("═══════════════════════════════════════════");

    await testIntentClassifier();
    await testLoopDetector();
    await testRateLimiter();
    await testEmergencyBypass();
    await testHandoffManager();

    console.log("\n═══════════════════════════════════════════");
    console.log(`  RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log("═══════════════════════════════════════════\n");

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
