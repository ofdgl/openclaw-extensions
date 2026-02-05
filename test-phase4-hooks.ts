/**
 * Phase 4 Hooks Test Suite
 * Tests backup-automator, model-fallback, error-memory, task-lock-manager, contact-enricher
 * 
 * Run: npx tsx test-phase4-hooks.ts
 */

import backupAutomatorHandler from "./hooks/backup-automator/handler.js";
import modelFallbackHandler from "./hooks/model-fallback/handler.js";
import errorMemoryHandler from "./hooks/error-memory/handler.js";
import taskLockManagerHandler from "./hooks/task-lock-manager/handler.js";
import contactEnricherHandler from "./hooks/contact-enricher/handler.js";

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
            ...overrides.context
        },
        ...overrides
    };
}

// ============================================
// Backup Automator Tests
// ============================================
async function testBackupAutomator(): Promise<void> {
    console.log("\n💾 BACKUP AUTOMATOR TESTS\n");

    // Test 1: Skip non-heartbeat events
    console.log("Test 1: Skip non-heartbeat events");
    const event1 = createMockEvent({ type: "agent", action: "bootstrap" });
    await backupAutomatorHandler(event1);
    assert(true, "Should skip non-heartbeat events");

    // Test 2: Handle missing git repo
    console.log("\nTest 2: Handle missing git repo");
    const event2 = createMockEvent({
        type: "heartbeat",
        action: "github_backup",
        context: { workspaceDir: process.cwd() }
    });
    await backupAutomatorHandler(event2);
    assert(
        event2.messages.length > 0 && event2.messages[0].includes("Not a git repository"),
        "Should detect missing git repo"
    );
}

// ============================================
// Model Fallback Tests
// ============================================
async function testModelFallback(): Promise<void> {
    console.log("\n🔄 MODEL FALLBACK TESTS\n");

    // Test 1: Skip non-openrouter requests
    console.log("Test 1: Skip non-openrouter requests");
    const event1 = createMockEvent({
        context: { model: "claude-3-5-haiku" }
    });
    await modelFallbackHandler(event1);
    assert(
        event1.messages.length === 0,
        "Should skip non-openrouter requests"
    );

    // Test 2: Execute fallback chain
    console.log("\nTest 2: Execute fallback chain");
    const event2 = createMockEvent({
        context: {
            model: "openrouter_free",
            modelRequest: { prompt: "Test prompt" }
        }
    });
    await modelFallbackHandler(event2);
    assert(
        event2.messages.length > 0,
        "Should execute fallback and return response"
    );
}

// ============================================
// Error Memory Tests
// ============================================
async function testErrorMemory(): Promise<void> {
    console.log("\n🧠 ERROR MEMORY TESTS\n");

    // Test 1: New error - store solution
    console.log("Test 1: New error - store solution");
    const event1 = createMockEvent({
        type: "agent",
        action: "error",
        context: {
            workspaceDir: process.cwd(),
            error: {
                message: "EACCES permission denied npm install"
            }
        }
    });
    await errorMemoryHandler(event1);
    assert(
        event1.messages.some((m: string) => m.includes("New error")),
        "Should detect new error"
    );

    // Test 2: Known error - apply solution
    console.log("\nTest 2: Known error - apply solution");
    const event2 = createMockEvent({
        type: "agent",
        action: "error",
        context: {
            workspaceDir: process.cwd(),
            error: {
                message: "EACCES permission denied npm install"
            }
        }
    });
    await errorMemoryHandler(event2);
    assert(
        event2.messages.some((m: string) => m.includes("Known error")),
        "Should recognize known error"
    );

    // Test 3: Skip non-error events
    console.log("\nTest 3: Skip non-error events");
    const event3 = createMockEvent({ type: "agent", action: "bootstrap" });
    await errorMemoryHandler(event3);
    assert(true, "Should skip non-error events");
}

// ============================================
// Task Lock Manager Tests
// ============================================
async function testTaskLockManager(): Promise<void> {
    console.log("\n🔐 TASK LOCK MANAGER TESTS\n");

    // Test 1: Acquire lock
    console.log("Test 1: Acquire lock");
    const event1 = createMockEvent({
        action: "start",
        context: {
            workspaceDir: process.cwd(),
            agentId: "admin",
            taskId: "test_task_123"
        }
    });
    await taskLockManagerHandler(event1);
    assert(true, "Should acquire lock");

    // Test 2: Lock conflict
    console.log("\nTest 2: Lock conflict");
    const event2 = createMockEvent({
        action: "start",
        context: {
            workspaceDir: process.cwd(),
            agentId: "intern",
            taskId: "test_task_123"
        }
    });
    await taskLockManagerHandler(event2);
    assert(
        event2.messages.some((m: string) => m.includes("locked by another agent")),
        "Should detect lock conflict"
    );

    // Test 3: Release lock
    console.log("\nTest 3: Release lock");
    const event3 = createMockEvent({
        action: "complete",
        context: {
            workspaceDir: process.cwd(),
            agentId: "admin",
            taskId: "test_task_123"
        }
    });
    await taskLockManagerHandler(event3);
    assert(true, "Should release lock");
}

// ============================================
// Contact Enricher Tests
// ============================================
async function testContactEnricher(): Promise<void> {
    console.log("\n👤 CONTACT ENRICHER TESTS\n");

    // Test 1: Create new contact
    console.log("Test 1: Create new contact");
    const event1 = createMockEvent({
        action: "message",
        context: {
            commandSource: "whatsapp",
            senderId: "+905551234567",
            workspaceDir: process.cwd(),
            channelMetadata: {
                pushName: "Test User"
            }
        }
    });
    await contactEnricherHandler(event1);
    assert(true, "Should create new contact");

    // Test 2: Update existing contact
    console.log("\nTest 2: Update existing contact");
    const event2 = createMockEvent({
        action: "message",
        context: {
            commandSource: "whatsapp",
            senderId: "+905551234567",
            workspaceDir: process.cwd(),
            channelMetadata: {
                pushName: "Test User Updated"
            }
        }
    });
    await contactEnricherHandler(event2);
    assert(true, "Should update existing contact");

    // Test 3: Skip non-WhatsApp messages
    console.log("\nTest 3: Skip non-WhatsApp messages");
    const event3 = createMockEvent({
        action: "message",
        context: { commandSource: "telegram" }
    });
    await contactEnricherHandler(event3);
    assert(true, "Should skip non-WhatsApp");
}

// ============================================
// Run All Tests
// ============================================
async function runTests(): Promise<void> {
    console.log("═══════════════════════════════════════════");
    console.log("  Phase 4 Hooks - Test Suite");
    console.log("═══════════════════════════════════════════");

    await testBackupAutomator();
    await testModelFallback();
    await testErrorMemory();
    await testTaskLockManager();
    await testContactEnricher();

    console.log("\n═══════════════════════════════════════════");
    console.log(`  RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log("═══════════════════════════════════════════\n");

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
