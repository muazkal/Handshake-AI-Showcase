import { getScenarioDefinition } from "./scenarios.js";

function normalizeCommand(input) {
  return input.trim().replace(/\s+/g, " ");
}

function createPrompt(hostname) {
  return `C:\\Users\\trainee@${hostname}>`;
}

function splitCommand(command) {
  const trimmed = normalizeCommand(command);
  return { raw: trimmed, lower: trimmed.toLowerCase() };
}

function markDiagnostic(state, tag) {
  if (!state.diagnosticSignals.includes(tag)) {
    state.diagnosticSignals.push(tag);
  }
}

function markFix(state, tag) {
  if (!state.fixActions.includes(tag)) {
    state.fixActions.push(tag);
  }
}

function addMistake(state, detail) {
  state.mistakes.push(detail);
}

function renderIpconfig(state) {
  const dnsLine =
    state.dnsServers.length > 0
      ? state.dnsServers.map((server, index) =>
          index === 0 ? `   DNS Servers . . . . . . . . . . . : ${server}` : `                                       ${server}`
        )
      : ["   DNS Servers . . . . . . . . . . . :"];

  return [
    "Windows IP Configuration",
    "",
    `${state.adapterName}:`,
    "   Connection-specific DNS Suffix  . : corp.example.local",
    "   Description . . . . . . . . . . . : Intel(R) Ethernet Connection",
    "   Physical Address. . . . . . . . . : 00-15-5D-2A-B1-7C",
    `   DHCP Enabled. . . . . . . . . . . : ${state.dhcpEnabled ? "Yes" : "No"}`,
    "   Autoconfiguration Enabled . . . . : Yes",
    `   IPv4 Address. . . . . . . . . . . : ${state.ipAddress}`,
    `   Subnet Mask . . . . . . . . . . . : ${state.subnetMask}`,
    `   Default Gateway . . . . . . . . . : ${state.defaultGateway}`,
    ...dnsLine,
    `   DHCP Server . . . . . . . . . . . : ${state.dhcpServer ?? ""}`
  ].join("\n");
}

function isIpAddress(target) {
  return /^\d+\.\d+\.\d+\.\d+$/.test(target);
}

function resolveHost(target) {
  const map = {
    "google.com": "142.250.72.14",
    "support.corp": "10.24.18.50",
    "portal.corp": "10.24.18.50",
    "fileserver.corp": "10.24.18.25"
  };
  return map[target] ?? target;
}

function renderPing(target, state) {
  if (target === "127.0.0.1") {
    return [
      "Pinging 127.0.0.1 with 32 bytes of data:",
      "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128",
      "",
      "Ping statistics for 127.0.0.1:",
      "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
    ].join("\n");
  }

  if (isIpAddress(target)) {
    if (!state.internetReachable) {
      return [
        `Pinging ${target} with 32 bytes of data:`,
        `Reply from ${state.ipAddress}: Destination host unreachable.`,
        `Reply from ${state.ipAddress}: Destination host unreachable.`,
        `Reply from ${state.ipAddress}: Destination host unreachable.`,
        `Reply from ${state.ipAddress}: Destination host unreachable.`,
        "",
        `Ping statistics for ${target}:`,
        "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
      ].join("\n");
    }

    return [
      `Pinging ${target} with 32 bytes of data:`,
      `Reply from ${target}: bytes=32 time=17ms TTL=118`,
      `Reply from ${target}: bytes=32 time=18ms TTL=118`,
      `Reply from ${target}: bytes=32 time=17ms TTL=118`,
      `Reply from ${target}: bytes=32 time=19ms TTL=118`,
      "",
      `Ping statistics for ${target}:`,
      "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
    ].join("\n");
  }

  if (!state.dnsReachable) {
    return `Ping request could not find host ${target}. Please check the name and try again.`;
  }

  if (state.dnsCacheCorrupted) {
    return `Ping request could not find host ${target}. Please check the name and try again.`;
  }

  const resolvedTarget = resolveHost(target);
  return [
    `Pinging ${target} [${resolvedTarget}] with 32 bytes of data:`,
    `Reply from ${resolvedTarget}: bytes=32 time=12ms TTL=120`,
    `Reply from ${resolvedTarget}: bytes=32 time=12ms TTL=120`,
    `Reply from ${resolvedTarget}: bytes=32 time=13ms TTL=120`,
    `Reply from ${resolvedTarget}: bytes=32 time=12ms TTL=120`,
    "",
    `Ping statistics for ${resolvedTarget}:`,
    "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
  ].join("\n");
}

function renderNslookup(target, state) {
  if (!state.dnsReachable || state.dnsServers.length === 0) {
    return `*** UnKnown can't find ${target}: Server failed`;
  }

  return [
    "Server:  dc01.corp.example.local",
    `Address:  ${state.dnsServers[0]}`,
    "",
    "Non-authoritative answer:",
    `Name:    ${target}`,
    `Address: ${resolveHost(target)}`
  ].join("\n");
}

function renderNetstat(state) {
  const internetLine = state.internetReachable
    ? `  TCP    ${state.ipAddress}:49712    172.217.14.206:443    ESTABLISHED`
    : `  TCP    ${state.ipAddress}:49692   0.0.0.0:0              CLOSED`;

  return [
    "Active Connections",
    "",
    "  Proto  Local Address          Foreign Address        State",
    "  TCP    127.0.0.1:49701        127.0.0.1:49702        ESTABLISHED",
    internetLine
  ].join("\n");
}

function renderTasklist(state) {
  const cpuSummary = state.performanceIssue ? "backup-agent.exe            7216 Console                    1    412,432 K    97" : "backup-agent.exe            7216 Console                    1     42,112 K     1";
  return [
    "Image Name                     PID Session Name        Session#    Mem Usage   CPU",
    "========================= ======== ================ =========== ============ =====",
    "System                           4 Services                   0      12,840 K     2",
    "explorer.exe                  2480 Console                    1      94,128 K     3",
    cpuSummary,
    "chrome.exe                    9812 Console                    1     356,404 K     4"
  ].join("\n");
}

function renderSystemInfo(state) {
  return [
    `Host Name:                 ${state.hostname}`,
    "OS Name:                   Microsoft Windows 11 Enterprise",
    "OS Version:                10.0.22631 N/A Build 22631",
    `Processor(s):              1 Processor(s) Installed.`,
    `                           [01]: Intel64 Family 6 Model 165 Stepping 3 GenuineIntel ~${state.performanceIssue ? "99" : "12"}% Processor Time`
  ].join("\n");
}

function renderWhoAmI() {
  return "corp\\helpdesk-admin";
}

function renderDomainUser(state) {
  return [
    `User name                    ${state.lockedUser}`,
    "Full Name                    DebugIT Trainee",
    "Account active               Yes",
    `Account locked               ${state.accountLocked ? "Yes" : "No"}`,
    "Password last set            4/15/2026 8:11 AM",
    "Local Group Memberships      *Domain Users",
    "Global Group memberships     *Helpdesk Trainees"
  ].join("\n");
}

function renderCurl(target, state) {
  if (!state.dnsReachable) {
    return `curl: (6) Could not resolve host: ${target}`;
  }

  if (state.dnsCacheCorrupted) {
    return `curl: (6) Could not resolve host: ${target}`;
  }

  if (!state.webReachable || state.firewallBlockingHttps) {
    return [
      `curl: (28) Failed to connect to ${target} port 443 after 10000 ms: Connection timed out`
    ].join("\n");
  }

  return [
    "HTTP/1.1 200 OK",
    "Server: corp-nginx",
    "Content-Type: text/html; charset=UTF-8",
    "",
    "<html><body>Support portal online.</body></html>"
  ].join("\n");
}

function renderRenew(state) {
  if (!state.networkServiceRunning) {
    return "The DHCP Client service is not running.\n\nAccess is denied.";
  }

  state.ipAddress = "10.24.18.57";
  state.subnetMask = "255.255.255.0";
  state.defaultGateway = "10.24.18.1";
  state.dnsServers = ["10.24.18.20"];
  state.dhcpServer = "10.24.18.10";
  state.dnsReachable = true;
  state.internetReachable = true;
  state.webReachable = true;
  markFix(state, "renew_dhcp");

  return [
    "Windows IP Configuration",
    "",
    "Ethernet adapter CorpNet",
    "",
    "Connection-specific DNS Suffix  . : corp.example.local",
    "IPv4 Address. . . . . . . . . . . : 10.24.18.57",
    "Default Gateway . . . . . . . . . : 10.24.18.1",
    "",
    "Successfully renewed the IP lease."
  ].join("\n");
}

function renderFlushDns(state) {
  markDiagnostic(state, "flushed_dns_cache");

  if (state.dnsCacheCorrupted) {
    state.dnsCacheCorrupted = false;
    markFix(state, "flush_dns");
  }

  if (!state.dnsServiceRunning) {
    return [
      "Windows IP Configuration",
      "",
      "Successfully flushed the DNS Resolver Cache.",
      "",
      "Note: Cached records were cleared, but new lookups may still fail while the DNS Client service is unavailable."
    ].join("\n");
  }

  return [
    "Windows IP Configuration",
    "",
    "Successfully flushed the DNS Resolver Cache."
  ].join("\n");
}

function renderRestartNetwork(state) {
  state.networkServiceRunning = true;
  markFix(state, "restart_network_service");
  return [
    "Restarting Network Location Awareness...",
    "[OK] Network Location Awareness restarted.",
    "[OK] DHCP Client verified."
  ].join("\n");
}

function renderRestartDns(state) {
  state.dnsServiceRunning = true;
  state.dnsReachable = true;
  markFix(state, "restart_dns_service");
  return [
    "Restarting DNS Client service...",
    "[OK] DNS Client restarted.",
    "[OK] Name resolution restored."
  ].join("\n");
}

function renderTaskKill(state, imageName) {
  if (imageName !== "backup-agent.exe") {
    addMistake(state, `Terminated the wrong process: ${imageName}`);
    return `ERROR: The process "${imageName}" not found.`;
  }

  state.performanceIssue = false;
  state.cpuUsage = 8;
  markFix(state, "kill_backup_agent");
  return "SUCCESS: The process \"backup-agent.exe\" with PID 7216 has been terminated.";
}

function renderUnlockAccount(state, username) {
  if (username !== state.lockedUser) {
    addMistake(state, `Attempted to unlock the wrong account: ${username}`);
    return `Account ${username} was not found in the domain.`;
  }

  state.accountLocked = false;
  markFix(state, "unlock_account");
  return `Account ${username} unlocked successfully.`;
}

function renderFirewallReset(state) {
  state.firewallBlockingHttps = false;
  state.webReachable = true;
  markFix(state, "reset_firewall");
  return [
    "Ok.",
    "Resetting all firewall rules to default state...",
    "Outbound HTTPS access restored."
  ].join("\n");
}

function isScenarioResolved(scenarioId, state) {
  switch (scenarioId) {
    case "no-internet-dhcp":
      return state.internetReachable && state.fixActions.includes("renew_dhcp");
    case "dns-failure":
      return state.dnsReachable && state.fixActions.includes("restart_dns_service");
    case "stale-dns-cache":
      return !state.dnsCacheCorrupted && state.fixActions.includes("flush_dns");
    case "slow-system-performance":
      return !state.performanceIssue && state.fixActions.includes("kill_backup_agent");
    case "login-authentication-failure":
      return !state.accountLocked && state.fixActions.includes("unlock_account");
    case "firewall-blocking-traffic":
      return !state.firewallBlockingHttps && state.webReachable && state.fixActions.includes("reset_firewall");
    case "dhcp-client-service-stopped":
      return state.networkServiceRunning && state.internetReachable && state.fixActions.includes("renew_dhcp");
    default:
      return false;
  }
}

function buildFeedbackNotes(state, diagnosticsComplete) {
  const notes = [];

  if (diagnosticsComplete) {
    notes.push("You validated the likely failure domain before changing the system, which matches strong support workflow.");
  } else {
    notes.push("You resolved the issue, but you skipped at least one key diagnostic step that would have tightened the diagnosis.");
  }

  if (state.mistakes.length > 0) {
    notes.push("Some commands did not materially advance the fix. Try mapping each command to a hypothesis before running it.");
  } else {
    notes.push("Your troubleshooting path stayed focused and efficient.");
  }

  return notes;
}

function evaluateCompletion(state, scenario) {
  const diagnosticsComplete = scenario.requiredDiagnostics.every((signal) =>
    state.diagnosticSignals.includes(signal)
  );

  state.completed = isScenarioResolved(scenario.id, state);
  if (!state.completed) {
    return null;
  }

  let score = 100;
  if (!diagnosticsComplete) {
    score -= 20;
  }
  score -= Math.max(0, state.commandsRun.length - 5) * 4;
  score -= state.mistakes.length * 6;
  score = Math.max(45, Math.min(100, score));

  let level = "Advanced";
  if (score < 85) {
    level = "Intermediate";
  }
  if (score < 65) {
    level = "Beginner";
  }

  return {
    score,
    level,
    diagnosis: scenario.diagnosis,
    rootCause: scenario.rootCause,
    optimalPath: scenario.optimalPath,
    userPath: state.commandsRun.map((entry) => entry.raw),
    mistakes: state.mistakes,
    notes: buildFeedbackNotes(state, diagnosticsComplete)
  };
}

function helpText() {
  return [
    "Supported commands:",
    "  ipconfig",
    "  ipconfig /renew",
    "  ipconfig /flushdns",
    "  ping <host>",
    "  nslookup <host>",
    "  netstat",
    "  tasklist",
    "  taskkill /im <process> /f",
    "  systeminfo",
    "  whoami",
    "  net user trainee /domain",
    "  unlock account trainee",
    "  curl https://support.corp",
    "  restart network service",
    "  restart dns service",
    "  netsh advfirewall reset",
    "  clear"
  ].join("\n");
}

function handleScenarioSpecificCommand(scenario, state, normalized, lower) {
  if (lower === "ipconfig /renew" || lower === "renew dhcp") {
    return renderRenew(state);
  }

  if (lower === "ipconfig /flushdns" || lower === "flush dns") {
    return renderFlushDns(state);
  }

  if (lower === "restart network service") {
    return renderRestartNetwork(state);
  }

  if (lower === "restart dns service") {
    return renderRestartDns(state);
  }

  if (lower === "tasklist") {
    markDiagnostic(state, "checked_tasklist");
    return renderTasklist(state);
  }

  if (lower === "systeminfo") {
    markDiagnostic(state, "checked_systeminfo");
    return renderSystemInfo(state);
  }

  if (lower.startsWith("taskkill /im ")) {
    const imageName = normalized.split(" ")[2]?.toLowerCase();
    return renderTaskKill(state, imageName);
  }

  if (lower === "whoami") {
    markDiagnostic(state, "checked_whoami");
    return renderWhoAmI();
  }

  if (lower === "net user trainee /domain") {
    markDiagnostic(state, "checked_domain_user");
    return renderDomainUser(state);
  }

  if (lower === "unlock account trainee") {
    return renderUnlockAccount(state, "trainee");
  }

  if (lower === "netsh advfirewall reset") {
    return renderFirewallReset(state);
  }

  if (lower.startsWith("curl ")) {
    const target = normalized.slice(5).trim().replace(/^https?:\/\//, "");
    markDiagnostic(state, "tested_https");
    return renderCurl(target, state);
  }

  return null;
}

export function createSession(scenarioId) {
  const scenario = getScenarioDefinition(scenarioId);
  if (!scenario) {
    throw new Error("Scenario not found");
  }

  const state = scenario.initializeState();

  return {
    scenarioId: scenario.id,
    scenario: {
      id: scenario.id,
      difficulty: scenario.difficulty,
      title: scenario.title,
      description: scenario.description,
      symptoms: scenario.symptoms,
      objective: scenario.objective
    },
    state,
    prompt: createPrompt(state.hostname)
  };
}

export function processCommand(session, input) {
  const scenario = getScenarioDefinition(session.scenarioId);
  const { state } = session;
  const normalized = normalizeCommand(input);
  const { lower } = splitCommand(normalized);

  if (!normalized) {
    return {
      prompt: session.prompt,
      command: input,
      output: "",
      completed: state.completed,
      evaluation: null
    };
  }

  const base = lower.split(" ")[0];
  state.commandsRun.push({ raw: normalized, base });

  let output = "";

  if (lower === "help") {
    output = helpText();
  } else if (lower === "clear") {
    output = "__CLEAR__";
  } else if (lower === "ipconfig") {
    markDiagnostic(state, "checked_ipconfig");
    output = renderIpconfig(state);
  } else if (lower.startsWith("ping ")) {
    const target = normalized.slice(5).trim().toLowerCase();
    markDiagnostic(state, "tested_ping");
    output = renderPing(target, state);
  } else if (lower.startsWith("nslookup ")) {
    const target = normalized.slice(9).trim().toLowerCase();
    markDiagnostic(state, "tested_dns");
    output = renderNslookup(target, state);
  } else if (lower === "netstat") {
    markDiagnostic(state, "checked_netstat");
    output = renderNetstat(state);
  } else {
    output = handleScenarioSpecificCommand(scenario, state, normalized, lower);
  }

  if (!output) {
    addMistake(state, `Unrecognized or ineffective command: ${normalized}`);
    output = `'${normalized}' is not recognized as an internal or external command,\noperable program or batch file.`;
  }

  const evaluation = evaluateCompletion(state, scenario);

  return {
    prompt: session.prompt,
    command: normalized,
    output,
    completed: state.completed,
    evaluation
  };
}
