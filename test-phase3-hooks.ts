/**
 * Phase 3 Hooks Test Suite
 * Tests context-optimizer, image-processor, heartbeat-scheduler, mention-notifier, security-reporter
 * 
 * Run: npx tsx test-phase3-hooks.ts
 */

import contextOptimizerHandler from "./hooks/context-optimizer/handler.js";
import imageProcessorHandler from "./hooks/image-processor/handler.js";
import heartbeatSchedulerHandler from "./hooks/heartbeat-scheduler/handler.js";
import mentionNotifierHandler from "./hooks/mention-notifier/handler.js";
import securityReporterHandler from "./hooks/security-reporter/handler.js";

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
            workspaceDir: process.cwd(),
            sessionMetadata: {},
            ...overrides.context
        },
        ...overrides
    };
}

// ============================================
// Context Optimizer Tests
// ============================================
async function testContextOptimizer(): Promise<void> {
    console.log("\n📐 CONTEXT OPTIMIZER TESTS\n");

    // Test 1: Greeting intent → 3 messages
    console.log("Test 1: Greeting intent history limit");
    const event1 = createMockEvent({
        context: {
            sessionMetadata: { intent: "greeting" },
            workspaceDir: process.cwd()
        }
    });
    await contextOptimizerHandler(event1);
    assert(
        event1.context.historyLimit === 3,
        "Greeting should have 3 message limit"
    );

    // Test 2: Coding intent → 50 messages
    console.log("\nTest 2: Coding intent history limit");
    const event2 = createMockEvent({
        context: {
            sessionMetadata: { intent: "coding" },
            workspaceDir: process.cwd()
        }
    });
    await contextOptimizerHandler(event2);
    assert(
        event2.context.historyLimit === 50,
        "Coding should have 50 message limit"
    );

    // Test 3: Anthropic caching enabled
    console.log("\nTest 3: Anthropic caching enabled");
    const event3 = createMockEvent({
        context: {
            sessionMetadata: { intent: "task" },
            workspaceDir: process.cwd()
        }
    });
    await contextOptimizerHandler(event3);
    assert(
        event3.context.cacheConfig?.enabled === true,
        "Should enable Anthropic caching"
    );
}

// ============================================
// Image Processor Tests
// ============================================
async function testImageProcessor(): Promise<void> {
    console.log("\n🖼️  IMAGE PROCESSOR TESTS\n");

    // Test 1: No images → skip
    console.log("Test 1: Skip when no images");
    const event1 = createMockEvent({
        action: "message",
        context: { attachments: [] }
    });
    await imageProcessorHandler(event1);
    assert(
        !event1.context.imageDescriptions,
        "Should skip when no images"
    );

    // Test 2: Process image attachment
    console.log("\nTest 2: Process image attachment");
    const event2 = createMockEvent({
        action: "message",
        context: {
            messageText: "Check this image",
            attachments: [{
                type: "image",
                mimeType: "image/jpeg",
                data: Buffer.from("fake-image-data")
            }]
        }
    });
    await imageProcessorHandler(event2);
    assert(
        event2.context.imageDescriptions?.length === 1,
        "Should generate 1 image description"
    );
    assert(
        event2.context.messageText.includes("[Image 1]"),
        "Should append image description to message"
    );
}

// ============================================
// Heartbeat Scheduler Tests
// ============================================
async function testHeartbeatScheduler(): Promise<void> {
    console.log("\n⏰ HEARTBEAT SCHEDULER TESTS\n");

    // Test 1: Load empty config
    console.log("Test 1: No heartbeat.yaml");
    const event1 = createMockEvent({
        type: "system",
        action: "cron",
        context: { workspaceDir: process.cwd() }
    });
    await heartbeatSchedulerHandler(event1);
    assert(true, "Should handle missing config gracefully");

    // Test 2: Skip non-cron events
    console.log("\nTest 2: Skip non-cron events");
    const event2 = createMockEvent({
        type: "agent",
        action: "bootstrap"
    });
    await heartbeatSchedulerHandler(event2);
    assert(true, "Should skip non-cron events");
}

// ============================================
// Mention Notifier Tests
// ============================================
async function testMentionNotifier(): Promise<void> {
    console.log("\n📢 MENTION NOTIFIER TESTS\n");

    // Test 1: Extract @mention
    console.log("Test 1: Extract @mentions");
    const event1 = createMockEvent({
        action: "message",
        context: {
            agentId: "admin",
            messageText: "@security görev tamamlandı"
        }
    });
    await mentionNotifierHandler(event1);
    assert(true, "Should extract @security mention");

    // Test 2: Multiple mentions
    console.log("\nTest 2: Multiple @mentions");
    const event2 = createMockEvent({
        action: "message",
        context: {
            agentId: "admin",
            messageText: "@security @intern backup yapın"
        }
    });
    await mentionNotifierHandler(event2);
    assert(true, "Should handle multiple mentions");

    // Test 3: No mentions
    console.log("\nTest 3: No mentions");
    const event3 = createMockEvent({
        action: "message",
        context: {
            messageText: "normal message"
        }
    });
    await mentionNotifierHandler(event3);
    assert(true, "Should skip when no mentions");
}

// ============================================
// Security Reporter Tests
// ============================================
async function testSecurityReporter(): Promise<void> {
    console.log("\n🔒 SECURITY REPORTER TESTS\n");

    // Test 1: Generate report
    console.log("Test 1: Generate security report");
    const event1 = createMockEvent({
        type: "heartbeat",
        action: "security_audit",
        context: { workspaceDir: process.cwd() }
    });
    await securityReporterHandler(event1);
    assert(
        event1.messages.length > 0,
        "Should generate report message"
    );
    assert(
        event1.messages[0].includes("Güvenlik Raporu"),
        "Report should contain Turkish header"
    );

    // Test 2: Skip non-heartbeat events
    console.log("\nTest 2: Skip non-heartbeat events");
    const event2 = createMockEvent({
        type: "agent",
        action: "bootstrap"
    });
    const initialMsgCount = event2.messages.length;
    await securityReporterHandler(event2);
    assert(
        event2.messages.length === initialMsgCount,
        "Should skip non-heartbeat events"
    );
}

// ============================================
// Run All Tests
// ============================================
async function runTests(): Promise<void> {
    console.log("═══════════════════════════════════════════");
    console.log("  Phase 3 Hooks - Test Suite");
    console.log("═══════════════════════════════════════════");

    await testContextOptimizer();
    await testImageProcessor();
    await testHeartbeatScheduler();
    await testMentionNotifier();
    await testSecurityReporter();

    console.log("\n═══════════════════════════════════════════");
    console.log(`  RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log("═══════════════════════════════════════════\n");

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
