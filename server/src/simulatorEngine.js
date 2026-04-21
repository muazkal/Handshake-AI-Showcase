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
          index === 0
            ? `   DNS Servers . . . . . . . . . . . : ${server}`
            : `                                       ${server}`
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

function isInternalCorpTarget(target) {
  return ["support.corp", "portal.corp", "fileserver.corp", "fileserver", "intranet.corp"].includes(target);
}

function resolveHost(target) {
  const map = {
    "google.com": "142.250.72.14",
    "support.corp": "10.24.18.50",
    "portal.corp": "10.24.18.50",
    "fileserver.corp": "10.24.18.25",
    fileserver: "10.24.18.25",
    "intranet.corp": "10.24.18.60"
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

  if (!state.dnsReachable || state.dnsServers.length === 0 || state.dnsCacheCorrupted || state.dnsServiceRunning === false) {
    return `Ping request could not find host ${target}. Please check the name and try again.`;
  }

  if (!state.vpnConnected && isInternalCorpTarget(target)) {
    return [
      `Pinging ${target} [${resolveHost(target)}] with 32 bytes of data:`,
      "Request timed out.",
      "Request timed out.",
      "Request timed out.",
      "Request timed out.",
      "",
      `Ping statistics for ${resolveHost(target)}:`,
      "    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)"
    ].join("\n");
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
  if (!state.dnsReachable || state.dnsServers.length === 0 || state.dnsServiceRunning === false) {
    return `*** UnKnown can't find ${target}: Server failed`;
  }

  if (state.dnsCacheCorrupted) {
    return `*** UnKnown can't find ${target}: Non-existent domain`;
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
    : `  TCP    ${state.ipAddress}:49692    0.0.0.0:0              CLOSED`;

  return [
    "Active Connections",
    "",
    "  Proto  Local Address          Foreign Address        State",
    "  TCP    127.0.0.1:49701        127.0.0.1:49702        ESTABLISHED",
    internetLine
  ].join("\n");
}

function renderTasklist(state) {
  const cpuValue = state.performanceIssue ? state.processCpu : 1;
  const memoryValue = state.performanceIssue ? state.processMemory : "42,112 K";
  return [
    "Image Name                     PID Session Name        Session#    Mem Usage   CPU",
    "========================= ======== ================ =========== ============ =====",
    "System                           4 Services                   0      12,840 K     2",
    "explorer.exe                  2480 Console                    1      94,128 K     3",
    `${state.processImage.padEnd(29)}7216 Console                    1 ${memoryValue.padStart(12)} ${String(cpuValue).padStart(5)}`,
    "chrome.exe                    9812 Console                    1     356,404 K     4"
  ].join("\n");
}

function renderSystemInfo(state) {
  return [
    `Host Name:                 ${state.hostname}`,
    "OS Name:                   Microsoft Windows 11 Enterprise",
    "OS Version:                10.0.22631 N/A Build 22631",
    "Processor(s):              1 Processor(s) Installed.",
    `                           [01]: Intel64 Family 6 Model 165 Stepping 3 GenuineIntel ~${state.performanceIssue ? "99" : "12"}% Processor Time`
  ].join("\n");
}

function renderWhoAmI() {
  return "corp\\helpdesk-admin";
}

function renderDomainUser(state, username) {
  if (username !== state.lockedUser) {
    return `The user name could not be found.\n\nMore help is available by typing NET HELPMSG 2221.`;
  }

  return [
    `User name                    ${state.lockedUser}`,
    "Full Name                    TroubleshootIT Trainee",
    "Account active               Yes",
    `Account locked               ${state.accountLocked ? "Yes" : "No"}`,
    "Password last set            4/15/2026 8:11 AM",
    "Local Group Memberships      *Domain Users",
    "Global Group memberships     *Helpdesk Trainees"
  ].join("\n");
}

function renderCurl(target, state) {
  if (!state.dnsReachable || state.dnsCacheCorrupted || state.dnsServiceRunning === false) {
    return `curl: (6) Could not resolve host: ${target}`;
  }

  if (state.proxyMisconfigured) {
    return `curl: (7) Failed to connect to proxy ${state.proxyServer.replace(/^https?:\/\//, "")}: No connection could be made because the target machine actively refused it.`;
  }

  if (!state.vpnConnected && isInternalCorpTarget(target)) {
    return `curl: (7) Failed to connect to ${target} port 443: Network is unreachable`;
  }

  if (state.timeSynced === false) {
    return `curl: (60) schannel: SEC_E_TIME_SKEW (${state.clockSkewMinutes} minutes) - The system clock is not synchronized.`;
  }

  if (!state.webReachable || state.firewallBlockingHttps) {
    return `curl: (28) Failed to connect to ${target} port 443 after 10000 ms: Connection timed out`;
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
  if (imageName !== state.processImage.toLowerCase()) {
    addMistake(state, `Terminated the wrong process: ${imageName}`);
    return `ERROR: The process "${imageName}" not found.`;
  }

  state.performanceIssue = false;
  state.cpuUsage = 8;
  markFix(state, "kill_runaway_process");
  return `SUCCESS: The process "${state.processImage}" with PID 7216 has been terminated.`;
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

function renderSpoolerQuery(state) {
  return [
    "SERVICE_NAME: spooler",
    "        TYPE               : 110  WIN32_OWN_PROCESS  (interactive)",
    `        STATE              : 4  ${state.printSpoolerRunning ? "RUNNING" : "STOPPED"}`,
    `                                ${state.printSpoolerRunning ? "(STOPPABLE, NOT_PAUSABLE, ACCEPTS_SHUTDOWN)" : "(NOT_STOPPABLE, NOT_PAUSABLE, IGNORES_SHUTDOWN)"}`,
    "        WIN32_EXIT_CODE    : 0  (0x0)",
    "        SERVICE_EXIT_CODE  : 0  (0x0)"
  ].join("\n");
}

function renderRestartPrintSpooler(state) {
  state.printSpoolerRunning = true;
  markFix(state, "restart_print_spooler");
  return [
    `Restarting Print Spooler for ${state.printerName} queue...`,
    "[OK] Print Spooler restarted.",
    "[OK] Queued print jobs can now process."
  ].join("\n");
}

function renderVpnStatus(state) {
  return [
    `Profile: ${state.vpnProfile}`,
    `State: ${state.vpnConnected ? "Connected" : "Disconnected"}`,
    `Tunnel Address: ${state.vpnConnected ? "172.19.44.22" : "Not assigned"}`,
    `Access to internal routes: ${state.vpnConnected ? "Available" : "Unavailable"}`
  ].join("\n");
}

function renderVpnConnect(state, profile) {
  if (profile !== state.vpnProfile) {
    addMistake(state, `Attempted to connect the wrong VPN profile: ${profile}`);
    return `VPN profile "${profile}" was not found.`;
  }

  state.vpnConnected = true;
  state.webReachable = true;
  markFix(state, "connect_vpn");
  return [
    `Connecting to ${profile}...`,
    "[OK] Tunnel established.",
    "[OK] Internal network routes available."
  ].join("\n");
}

function renderNetUse(state) {
  const status = state.mappedDriveConnected ? "OK" : "Disconnected";
  return [
    "New connections will be remembered.",
    "",
    "Status       Local     Remote                    Network",
    "-------------------------------------------------------------------------------",
    `${status.padEnd(12)}${`${state.mappedDriveLetter}:`.padEnd(10)}${state.mappedShare.padEnd(26)}Microsoft Windows Network`,
    "The command completed successfully."
  ].join("\n");
}

function renderMapDrive(state, driveLetter, sharePath) {
  const normalizedDrive = driveLetter.replace(":", "").toUpperCase();
  const normalizedShare = sharePath.toLowerCase();

  if (normalizedDrive !== state.mappedDriveLetter || normalizedShare !== state.mappedShare.toLowerCase()) {
    addMistake(state, `Mapped the wrong drive target: ${driveLetter} ${sharePath}`);
    return "System error 67 has occurred.\n\nThe network name cannot be found.";
  }

  state.mappedDriveConnected = true;
  markFix(state, "map_drive");
  return `The command completed successfully.\n\nDrive ${state.mappedDriveLetter}: is now connected to ${state.mappedShare}.`;
}

function renderProxyShow(state) {
  return state.proxyMisconfigured
    ? ["Current WinHTTP proxy settings:", `    Proxy Server(s) : ${state.proxyServer}`, "    Bypass List     : <local>"].join("\n")
    : ["Current WinHTTP proxy settings:", "    Direct access (no proxy server)."].join("\n");
}

function renderProxyReset(state) {
  state.proxyMisconfigured = false;
  markFix(state, "reset_proxy");
  return [
    "Current WinHTTP proxy settings:",
    "    Direct access (no proxy server)."
  ].join("\n");
}

function renderDiskFree(state) {
  const total = 512000000000;
  const free = state.diskFreeMb * 1024 * 1024;
  return [
    `Total # of free bytes        : ${free}`,
    `Total # of bytes             : ${total}`,
    `Total # of avail free bytes  : ${free}`
  ].join("\n");
}

function renderCleanMgr(state) {
  state.diskFull = false;
  state.diskFreeMb = 18450;
  markFix(state, "cleanup_disk");
  return [
    "Disk Cleanup is removing temporary files...",
    "[OK] Windows Update Cleanup completed.",
    "[OK] Temporary files removed.",
    `Free space on C: is now ${state.diskFreeMb} MB.`
  ].join("\n");
}

function renderUpdateServiceQuery(state) {
  return [
    "SERVICE_NAME: wuauserv",
    "        TYPE               : 20  WIN32_SHARE_PROCESS",
    `        STATE              : 4  ${state.updateServiceRunning ? "RUNNING" : "STOPPED"}`,
    "        WIN32_EXIT_CODE    : 0  (0x0)",
    "        SERVICE_EXIT_CODE  : 0  (0x0)"
  ].join("\n");
}

function renderRestartUpdateService(state) {
  state.updateServiceRunning = true;
  markFix(state, "restart_update_service");
  return [
    "Restarting Windows Update service...",
    "[OK] Windows Update service restarted.",
    "[OK] Update scans can proceed."
  ].join("\n");
}

function renderTimeStatus(state) {
  return [
    `Leap Indicator: ${state.timeSynced ? 0 : 3}`,
    "Stratum: 4 (secondary reference - syncd by (S)NTP)",
    `Precision: -23 (${state.timeSynced ? "119.209ns per tick" : "unsynchronized"})`,
    `Last Successful Sync Time: ${state.timeSynced ? "4/16/2026 7:58:44 AM" : "N/A"}`,
    `Source: ${state.timeSynced ? "dc01.corp.example.local" : "Local CMOS Clock"}`,
    `Clock Skew: ${state.clockSkewMinutes} minute(s)`
  ].join("\n");
}

function renderTimeResync(state) {
  state.timeSynced = true;
  state.clockSkewMinutes = 0;
  state.webReachable = true;
  markFix(state, "resync_time");
  return "Sending resync command to local computer...\nThe command completed successfully.";
}

function isScenarioResolved(scenario, state) {
  switch (scenario.mechanic) {
    case "dhcp_apipa":
      return state.internetReachable && state.fixActions.includes("renew_dhcp");
    case "dns_service":
      return state.dnsReachable && state.fixActions.includes("restart_dns_service");
    case "stale_dns_cache":
      return !state.dnsCacheCorrupted && state.fixActions.includes("flush_dns");
    case "print_spooler":
      return state.printSpoolerRunning && state.fixActions.includes("restart_print_spooler");
    case "performance_process":
      return !state.performanceIssue && state.fixActions.includes("kill_runaway_process");
    case "account_lockout":
      return !state.accountLocked && state.fixActions.includes("unlock_account");
    case "firewall_https":
      return !state.firewallBlockingHttps && state.webReachable && state.fixActions.includes("reset_firewall");
    case "vpn_disconnected":
      return state.vpnConnected && state.fixActions.includes("connect_vpn");
    case "mapped_drive":
      return state.mappedDriveConnected && state.fixActions.includes("map_drive");
    case "dhcp_service_stopped":
      return state.networkServiceRunning && state.internetReachable && state.fixActions.includes("renew_dhcp");
    case "proxy_misconfig":
      return !state.proxyMisconfigured && state.fixActions.includes("reset_proxy");
    case "disk_full":
      return !state.diskFull && state.diskFreeMb > 5000 && state.fixActions.includes("cleanup_disk");
    case "update_service":
      return state.updateServiceRunning && state.fixActions.includes("restart_update_service");
    case "time_skew":
      return state.timeSynced && state.fixActions.includes("resync_time");
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

  state.completed = isScenarioResolved(scenario, state);
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
    "  net user <user> /domain",
    "  unlock account <user>",
    "  curl https://support.corp",
    "  sc query spooler",
    "  restart print spooler",
    "  vpn status",
    "  vpn connect corp-vpn",
    "  net use",
    "  net use z: \\\\fileserver\\dept",
    "  netsh winhttp show proxy",
    "  netsh winhttp reset proxy",
    "  fsutil volume diskfree c:",
    "  cleanmgr /sagerun",
    "  sc query wuauserv",
    "  restart update service",
    "  w32tm /query /status",
    "  w32tm /resync",
    "  restart network service",
    "  restart dns service",
    "  netsh advfirewall reset",
    "  clear"
  ].join("\n");
}

function handleScenarioSpecificCommand(state, normalized, lower) {
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

  const domainMatch = normalized.match(/^net user (\S+) \/domain$/i);
  if (domainMatch) {
    markDiagnostic(state, "checked_domain_user");
    return renderDomainUser(state, domainMatch[1].toLowerCase());
  }

  const unlockMatch = normalized.match(/^unlock account (\S+)$/i);
  if (unlockMatch) {
    return renderUnlockAccount(state, unlockMatch[1].toLowerCase());
  }

  if (lower === "netsh advfirewall reset") {
    return renderFirewallReset(state);
  }

  if (lower.startsWith("curl ")) {
    const target = normalized.slice(5).trim().replace(/^https?:\/\//i, "").toLowerCase();
    markDiagnostic(state, "tested_https");
    return renderCurl(target, state);
  }

  if (lower === "sc query spooler") {
    markDiagnostic(state, "checked_spooler_status");
    return renderSpoolerQuery(state);
  }

  if (lower === "restart print spooler") {
    return renderRestartPrintSpooler(state);
  }

  if (lower === "vpn status") {
    markDiagnostic(state, "checked_vpn_status");
    return renderVpnStatus(state);
  }

  const vpnMatch = normalized.match(/^vpn connect (\S+)$/i);
  if (vpnMatch) {
    return renderVpnConnect(state, vpnMatch[1].toLowerCase());
  }

  if (lower === "net use") {
    markDiagnostic(state, "checked_mapped_drive");
    return renderNetUse(state);
  }

  const netUseMatch = normalized.match(/^net use ([a-z]:) (\\\\[^\s]+\\[^\s]+)$/i);
  if (netUseMatch) {
    return renderMapDrive(state, netUseMatch[1], netUseMatch[2]);
  }

  if (lower === "netsh winhttp show proxy") {
    markDiagnostic(state, "checked_proxy");
    return renderProxyShow(state);
  }

  if (lower === "netsh winhttp reset proxy") {
    return renderProxyReset(state);
  }

  if (lower === "fsutil volume diskfree c:") {
    markDiagnostic(state, "checked_disk_space");
    return renderDiskFree(state);
  }

  if (lower === "cleanmgr /sagerun") {
    return renderCleanMgr(state);
  }

  if (lower === "sc query wuauserv") {
    markDiagnostic(state, "checked_update_service");
    return renderUpdateServiceQuery(state);
  }

  if (lower === "restart update service") {
    return renderRestartUpdateService(state);
  }

  if (lower === "w32tm /query /status") {
    markDiagnostic(state, "checked_time_status");
    return renderTimeStatus(state);
  }

  if (lower === "w32tm /resync") {
    return renderTimeResync(state);
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
    output = handleScenarioSpecificCommand(state, normalized, lower);
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
