function createBaseState(overrides) {
  return {
    hostname: "WKSTN-01",
    adapterName: "Ethernet adapter CorpNet",
    ipAddress: "10.24.18.57",
    subnetMask: "255.255.255.0",
    defaultGateway: "10.24.18.1",
    dnsServers: ["10.24.18.20"],
    dhcpEnabled: true,
    dhcpServer: "10.24.18.10",
    dnsReachable: true,
    dnsServiceRunning: true,
    dnsCacheCorrupted: false,
    networkServiceRunning: true,
    internetReachable: true,
    webReachable: true,
    performanceIssue: false,
    cpuUsage: 12,
    processImage: "backup-agent.exe",
    processCpu: 97,
    processMemory: "412,432 K",
    lockedUser: "trainee",
    accountLocked: false,
    firewallBlockingHttps: false,
    printSpoolerRunning: true,
    printerName: "HP LaserJet M404dn",
    vpnConnected: true,
    vpnProfile: "corp-vpn",
    mappedDriveConnected: true,
    mappedDriveLetter: "Z",
    mappedShare: "\\\\fileserver\\dept",
    proxyMisconfigured: false,
    proxyServer: "http://10.24.18.200:8080",
    diskFull: false,
    diskFreeMb: 18450,
    updateServiceRunning: true,
    timeSynced: true,
    clockSkewMinutes: 0,
    commandsRun: [],
    mistakes: [],
    diagnosticSignals: [],
    fixActions: [],
    completed: false,
    ...overrides
  };
}

function buildFamily(shared, items) {
  return items.map((item) => ({
    ...shared,
    id: item.id,
    title: item.title,
    description: item.description ?? shared.description,
    symptoms: item.symptoms ?? shared.symptoms,
    objective: item.objective ?? shared.objective,
    initializeState() {
      return createBaseState({
        ...(shared.stateOverrides ?? {}),
        ...(item.stateOverrides ?? {})
      });
    }
  }));
}

const beginnerDhcpLease = buildFamily(
  {
    difficulty: "Beginner",
    mechanic: "dhcp_apipa",
    description: "The workstation lost general network connectivity and appears to be operating without a valid DHCP lease.",
    symptoms: [
      "Browser cannot reach external websites.",
      "Ping requests to public IPs fail.",
      "The network icon shows limited connectivity.",
      "The adapter may not have a usable address."
    ],
    objective: "Restore network connectivity so the workstation receives a valid DHCP lease and can resolve external hosts.",
    diagnosis: "DHCP lease failure with APIPA fallback",
    rootCause: "The workstation did not receive a valid DHCP lease and fell back to an APIPA address with no usable gateway path.",
    requiredDiagnostics: ["checked_ipconfig", "tested_ping"],
    optimalPath: [
      "Inspect the adapter with ipconfig.",
      "Confirm connectivity failure with ping 8.8.8.8.",
      "Renew the DHCP lease with ipconfig /renew.",
      "Validate success with ipconfig and ping google.com."
    ],
    stateOverrides: {
      ipAddress: "169.254.22.81",
      subnetMask: "255.255.0.0",
      defaultGateway: "0.0.0.0",
      dnsServers: [],
      dhcpServer: null,
      dnsReachable: false,
      internetReachable: false,
      webReachable: false
    }
  },
  [
    { id: "desk-move-lease-loss", title: "Desk Move Lease Loss" },
    { id: "new-dock-no-connectivity", title: "New Dock No Connectivity" },
    { id: "patch-panel-swap-offline", title: "Patch Panel Swap Offline" },
    { id: "overnight-lease-expired", title: "Overnight Lease Expired" },
    { id: "imaging-room-no-network", title: "Imaging Room No Network" },
    { id: "conference-hotdesk-offline", title: "Conference Hot Desk Offline" },
    { id: "nic-reset-after-update", title: "NIC Reset After Update" },
    { id: "resume-from-sleep-no-lease", title: "Resume From Sleep No Lease" }
  ]
);

const beginnerDnsService = buildFamily(
  {
    difficulty: "Beginner",
    mechanic: "dns_service",
    description: "The workstation has general network access, but hostname resolution is failing because the local DNS client path is unhealthy.",
    symptoms: [
      "Public IPs respond while domain names do not.",
      "The machine has a valid IP address and gateway.",
      "Hostname lookups fail consistently.",
      "The issue appears local to one endpoint."
    ],
    objective: "Restore DNS resolution so the system can resolve hostnames without changing the working IP configuration.",
    diagnosis: "DNS client service failure",
    rootCause: "The DNS Client service stopped responding, leaving the workstation unable to resolve hostnames despite otherwise normal connectivity.",
    requiredDiagnostics: ["checked_ipconfig", "tested_ping", "tested_dns"],
    optimalPath: [
      "Confirm the workstation has a valid IP configuration with ipconfig.",
      "Verify raw connectivity with ping 8.8.8.8.",
      "Validate name resolution is failing with nslookup google.com.",
      "Restart the DNS client service with restart dns service and retest."
    ],
    stateOverrides: {
      hostname: "WKSTN-22",
      ipAddress: "10.24.18.88",
      dnsReachable: false,
      dnsServiceRunning: false
    }
  },
  [
    { id: "web-browsing-fails-by-name", title: "Web Browsing Fails By Name" },
    { id: "cloud-app-name-resolution-error", title: "Cloud App Name Resolution Error" },
    { id: "browser-host-lookup-failure", title: "Browser Host Lookup Failure" },
    { id: "teams-signin-name-error", title: "Teams Sign-In Name Error" },
    { id: "name-lookup-broken-after-update", title: "Name Lookup Broken After Update" },
    { id: "internal-site-hostname-failure", title: "Internal Site Hostname Failure" }
  ]
);

const beginnerDnsCache = buildFamily(
  {
    difficulty: "Beginner",
    mechanic: "stale_dns_cache",
    description: "The workstation is holding stale DNS resolver data for a host that was recently changed or migrated.",
    symptoms: [
      "General connectivity is normal.",
      "Only one hostname behaves incorrectly on this PC.",
      "Other workstations resolve the host correctly.",
      "The issue started after a recent DNS change."
    ],
    objective: "Clear the stale resolver data so the workstation can resolve the updated hostname correctly.",
    diagnosis: "Corrupted local DNS cache entry",
    rootCause: "The workstation cached an outdated DNS answer locally and needs the resolver cache flushed.",
    requiredDiagnostics: ["checked_ipconfig", "tested_dns", "tested_ping"],
    optimalPath: [
      "Confirm the machine has a valid network configuration with ipconfig.",
      "Check the hostname with nslookup support.corp.",
      "Flush the stale resolver cache with ipconfig /flushdns.",
      "Retest ping support.corp or curl https://support.corp."
    ],
    stateOverrides: {
      hostname: "WKSTN-27",
      ipAddress: "10.24.18.127",
      dnsCacheCorrupted: true
    }
  },
  [
    { id: "updated-portal-still-old-address", title: "Updated Portal Still Old Address" },
    { id: "recently-migrated-app-wont-resolve", title: "Recently Migrated App Won't Resolve" },
    { id: "dns-cutover-cached-wrong", title: "DNS Cutover Cached Wrong" },
    { id: "renamed-server-host-cache", title: "Renamed Server Host Cache" },
    { id: "new-record-not-reaching-one-pc", title: "New Record Not Reaching One PC" }
  ]
);

const beginnerPrintSpooler = buildFamily(
  {
    difficulty: "Beginner",
    mechanic: "print_spooler",
    description: "The workstation cannot print because the local print spooler is not processing jobs.",
    symptoms: [
      "Jobs remain stuck in the print queue.",
      "The printer works for other users.",
      "The problem is isolated to one endpoint.",
      "Applications appear to print but nothing comes out."
    ],
    objective: "Restore printing by bringing the print spooler back online so queued jobs can process normally.",
    diagnosis: "Print spooler service stopped",
    rootCause: "The local print spooler service stopped, preventing jobs from leaving the queue.",
    requiredDiagnostics: ["checked_spooler_status"],
    optimalPath: [
      "Check the print spooler service with sc query spooler.",
      "Restart the service with restart print spooler.",
      "Confirm the spooler is running again."
    ],
    stateOverrides: {
      printSpoolerRunning: false
    }
  },
  [
    { id: "printer-jobs-stuck-in-queue", title: "Printer Jobs Stuck In Queue" },
    { id: "nothing-prints-after-wake", title: "Nothing Prints After Wake" },
    { id: "shared-printer-offline-one-pc", title: "Shared Printer Offline On One PC" },
    { id: "pdf-queue-frozen", title: "PDF Queue Frozen" },
    { id: "label-printer-queue-hung", title: "Label Printer Queue Hung" },
    { id: "branch-printer-queue-error", title: "Branch Printer Queue Error" }
  ]
);

const intermediatePerformance = buildFamily(
  {
    difficulty: "Intermediate",
    mechanic: "performance_process",
    description: "One runaway background process is consuming enough CPU to make the workstation sluggish across normal work.",
    symptoms: [
      "Applications open slowly.",
      "The system feels hot and laggy.",
      "Input delay is noticeable.",
      "CPU usage is abnormally high."
    ],
    objective: "Identify the process consuming system resources and restore normal performance without rebooting the system.",
    diagnosis: "Runaway workstation process consuming CPU",
    rootCause: "A background process entered a bad loop and consumed most available CPU time.",
    requiredDiagnostics: ["checked_tasklist"],
    optimalPath: [
      "Inspect running processes with tasklist.",
      "Identify the abnormal process using most CPU.",
      "Terminate it with taskkill /im <process> /f.",
      "Confirm the system has stabilized."
    ]
  },
  [
    { id: "backup-agent-maxing-cpu", title: "Backup Agent Maxing CPU", stateOverrides: { performanceIssue: true, processImage: "backup-agent.exe", processCpu: 97, processMemory: "412,432 K", cpuUsage: 99 } },
    { id: "onedrive-sync-runaway", title: "OneDrive Sync Runaway", stateOverrides: { performanceIssue: true, processImage: "onedrive.exe", processCpu: 95, processMemory: "366,180 K", cpuUsage: 98 } },
    { id: "browser-helper-cpu-spike", title: "Browser Helper CPU Spike", stateOverrides: { performanceIssue: true, processImage: "browser-helper.exe", processCpu: 93, processMemory: "298,884 K", cpuUsage: 97 } },
    { id: "inventory-agent-loop", title: "Inventory Agent Loop", stateOverrides: { performanceIssue: true, processImage: "inventory-agent.exe", processCpu: 96, processMemory: "274,120 K", cpuUsage: 98 } },
    { id: "endpoint-scanner-resource-spike", title: "Endpoint Scanner Resource Spike", stateOverrides: { performanceIssue: true, processImage: "endpoint-scan.exe", processCpu: 94, processMemory: "321,552 K", cpuUsage: 98 } },
    { id: "log-collector-pegging-workstation", title: "Log Collector Pegging Workstation", stateOverrides: { performanceIssue: true, processImage: "log-collector.exe", processCpu: 92, processMemory: "255,104 K", cpuUsage: 97 } }
  ]
);

const intermediateLockout = buildFamily(
  {
    difficulty: "Intermediate",
    mechanic: "account_lockout",
    description: "A domain user is locked out after repeated failed sign-in attempts and needs account access restored.",
    symptoms: [
      "Correct credentials still fail.",
      "The issue affects one account only.",
      "Network connectivity is normal.",
      "Authentication is the problem domain."
    ],
    objective: "Restore the locked domain account so the user can authenticate again.",
    diagnosis: "Domain account lockout",
    rootCause: "The user account was locked after repeated failed sign-in attempts.",
    requiredDiagnostics: ["checked_whoami", "checked_domain_user"],
    optimalPath: [
      "Inspect the current identity context with whoami.",
      "Check the affected account with net user trainee /domain.",
      "Unlock the account with unlock account trainee.",
      "Validate the account now shows as active."
    ],
    stateOverrides: {
      hostname: "DC-HELPER",
      ipAddress: "10.24.18.12",
      dhcpServer: null,
      accountLocked: true
    }
  },
  [
    { id: "remote-user-locked-after-vpn-tries", title: "Remote User Locked After VPN Tries" },
    { id: "office-user-locked-at-monday-login", title: "Office User Locked At Monday Login" },
    { id: "cached-mobile-device-lockout", title: "Cached Mobile Device Lockout" },
    { id: "new-password-not-working-yet", title: "New Password Not Working Yet" },
    { id: "conference-kiosk-user-lockout", title: "Conference Kiosk User Lockout" }
  ]
);

const intermediateFirewall = buildFamily(
  {
    difficulty: "Intermediate",
    mechanic: "firewall_https",
    description: "The workstation can resolve names and ping remote hosts, but outbound HTTPS traffic is blocked locally.",
    symptoms: [
      "Name resolution works normally.",
      "Basic ping tests succeed.",
      "Browser or curl attempts to HTTPS time out.",
      "The issue began after a local firewall rule or policy change."
    ],
    objective: "Restore outbound HTTPS access without changing the working IP or DNS configuration.",
    diagnosis: "Local firewall blocking outbound HTTPS",
    rootCause: "A restrictive local firewall rule blocked outbound TCP 443.",
    requiredDiagnostics: ["tested_ping", "tested_dns", "tested_https"],
    optimalPath: [
      "Verify reachability with ping support.corp.",
      "Confirm name resolution with nslookup support.corp.",
      "Test the application path with curl https://support.corp.",
      "Reset the local firewall with netsh advfirewall reset and retry."
    ],
    stateOverrides: {
      firewallBlockingHttps: true,
      webReachable: false
    }
  },
  [
    { id: "support-portal-times-out", title: "Support Portal Times Out" },
    { id: "hr-site-blocked-after-policy-test", title: "HR Site Blocked After Policy Test" },
    { id: "vpn-less-laptop-https-blocked", title: "Laptop HTTPS Blocked Locally" },
    { id: "ticketing-site-timeout-after-firewall-change", title: "Ticketing Site Timeout After Firewall Change" },
    { id: "browser-only-web-access-broken", title: "Browser Web Access Broken By Firewall" }
  ]
);

const intermediateVpn = buildFamily(
  {
    difficulty: "Intermediate",
    mechanic: "vpn_disconnected",
    description: "The remote workstation can reach the internet but cannot access internal company resources because the VPN is disconnected.",
    symptoms: [
      "Public sites work normally.",
      "Internal portals and file shares are unreachable.",
      "The issue affects a remote user.",
      "The workstation needs access to internal resources."
    ],
    objective: "Reconnect the VPN so the workstation can reach internal corporate resources again.",
    diagnosis: "Corporate VPN disconnected",
    rootCause: "The workstation was off the corporate network and the VPN tunnel was not connected.",
    requiredDiagnostics: ["checked_vpn_status", "tested_https"],
    optimalPath: [
      "Check VPN health with vpn status.",
      "Confirm internal access is failing with curl https://support.corp.",
      "Reconnect with vpn connect corp-vpn.",
      "Retest the internal resource."
    ],
    stateOverrides: {
      vpnConnected: false,
      webReachable: false
    }
  },
  [
    { id: "remote-user-cant-open-intranet", title: "Remote User Can't Open Intranet" },
    { id: "work-from-home-file-access-fails", title: "Work From Home File Access Fails" },
    { id: "travel-laptop-needs-vpn", title: "Travel Laptop Needs VPN" },
    { id: "hotel-wifi-no-corp-access", title: "Hotel Wi-Fi No Corp Access" },
    { id: "new-remote-hire-internal-site-offline", title: "New Remote Hire Internal Site Offline" }
  ]
);

const intermediateDriveMap = buildFamily(
  {
    difficulty: "Intermediate",
    mechanic: "mapped_drive",
    description: "The user lost access to a common department share because the mapped drive is disconnected.",
    symptoms: [
      "One drive letter is unavailable.",
      "The workstation otherwise has normal network access.",
      "The user cannot reach a shared department folder.",
      "The issue is limited to the mapped drive path."
    ],
    objective: "Restore access to the shared drive by reconnecting the mapped network drive.",
    diagnosis: "Mapped drive disconnected",
    rootCause: "The persistent drive mapping dropped and needs to be reconnected to the file share.",
    requiredDiagnostics: ["checked_mapped_drive"],
    optimalPath: [
      "Inspect current mappings with net use.",
      "Reconnect the department drive with net use z: \\\\fileserver\\dept.",
      "Verify the drive now shows as connected."
    ],
    stateOverrides: {
      mappedDriveConnected: false
    }
  },
  [
    { id: "finance-share-drive-disconnected", title: "Finance Share Drive Disconnected" },
    { id: "department-z-drive-missing", title: "Department Z Drive Missing" },
    { id: "relogon-broke-drive-map", title: "Relogon Broke Drive Map" },
    { id: "shared-folder-shortcut-fails", title: "Shared Folder Shortcut Fails" }
  ]
);

const advancedDhcpService = buildFamily(
  {
    difficulty: "Advanced",
    mechanic: "dhcp_service_stopped",
    description: "The workstation shows APIPA addressing and lease renewals fail because the DHCP client workflow is stopped locally.",
    symptoms: [
      "The workstation shows an APIPA address.",
      "Renewing the lease initially fails.",
      "Cable and switch connectivity are already confirmed.",
      "The issue started after service configuration changes."
    ],
    objective: "Restore the DHCP client workflow so the workstation can request and receive a valid lease again.",
    diagnosis: "DHCP Client service stopped",
    rootCause: "The DHCP Client service was stopped locally, preventing lease renewal.",
    requiredDiagnostics: ["checked_ipconfig", "tested_ping"],
    optimalPath: [
      "Inspect the adapter with ipconfig.",
      "Confirm connectivity is broken with ping 8.8.8.8.",
      "Restart the network service with restart network service.",
      "Renew the lease with ipconfig /renew and validate."
    ],
    stateOverrides: {
      ipAddress: "169.254.41.23",
      subnetMask: "255.255.0.0",
      defaultGateway: "0.0.0.0",
      dnsServers: [],
      dhcpServer: null,
      dnsReachable: false,
      internetReachable: false,
      webReachable: false,
      networkServiceRunning: false
    }
  },
  [
    { id: "security-hardening-disabled-dhcp", title: "Security Hardening Disabled DHCP" },
    { id: "lab-image-service-left-off", title: "Lab Image Left DHCP Service Off" },
    { id: "manual-tuning-broke-dhcp-client", title: "Manual Tuning Broke DHCP Client" },
    { id: "service-baseline-change-no-lease", title: "Service Baseline Change No Lease" },
    { id: "pilot-workstation-dhcp-service-stopped", title: "Pilot Workstation DHCP Service Stopped" }
  ]
);

const advancedProxy = buildFamily(
  {
    difficulty: "Advanced",
    mechanic: "proxy_misconfig",
    description: "Web access is broken because the workstation is attempting to use an invalid proxy configuration.",
    symptoms: [
      "General network connectivity is fine.",
      "Web access fails quickly rather than timing out slowly.",
      "The problem started after network or browser proxy changes.",
      "Internal and external sites fail through HTTP tooling."
    ],
    objective: "Restore direct web access by removing the invalid proxy configuration.",
    diagnosis: "Invalid workstation proxy configuration",
    rootCause: "A stale proxy setting redirected traffic to a nonfunctional proxy host.",
    requiredDiagnostics: ["checked_proxy", "tested_https"],
    optimalPath: [
      "Inspect proxy settings with netsh winhttp show proxy.",
      "Verify web access is failing with curl https://support.corp.",
      "Reset the proxy with netsh winhttp reset proxy.",
      "Retest the site."
    ],
    stateOverrides: {
      proxyMisconfigured: true
    }
  },
  [
    { id: "stale-proxy-after-office-move", title: "Stale Proxy After Office Move" },
    { id: "browser-deployment-set-bad-proxy", title: "Bad Proxy From Browser Deployment" },
    { id: "internet-options-left-proxy-on", title: "Internet Options Left Proxy On" },
    { id: "temporary-proxy-test-never-removed", title: "Temporary Proxy Test Never Removed" },
    { id: "conference-room-pc-proxy-misconfig", title: "Conference Room PC Proxy Misconfig" }
  ]
);

const advancedDisk = buildFamily(
  {
    difficulty: "Advanced",
    mechanic: "disk_full",
    description: "The system drive is nearly full, causing application failures and update issues on the workstation.",
    symptoms: [
      "Applications complain about low disk space.",
      "Updates or installers fail unexpectedly.",
      "The workstation may feel unstable during routine tasks.",
      "The issue centers on local storage capacity."
    ],
    objective: "Free enough disk space on the system drive so the workstation can resume normal operation.",
    diagnosis: "System drive critically low on free space",
    rootCause: "The system volume ran critically low on space and needed cleanup before normal operations could continue.",
    requiredDiagnostics: ["checked_disk_space"],
    optimalPath: [
      "Inspect free space with fsutil volume diskfree c:.",
      "Run cleanup with cleanmgr /sagerun.",
      "Confirm free space has recovered."
    ],
    stateOverrides: {
      diskFull: true,
      diskFreeMb: 420
    }
  },
  [
    { id: "windows-update-fails-low-space", title: "Windows Update Fails Low Space" },
    { id: "temp-files-filled-system-drive", title: "Temp Files Filled System Drive" },
    { id: "install-fails-due-to-full-c-drive", title: "Install Fails Due To Full C Drive" },
    { id: "onedrive-cache-filled-laptop", title: "OneDrive Cache Filled Laptop" },
    { id: "loaner-laptop-near-zero-space", title: "Loaner Laptop Near Zero Space" }
  ]
);

const advancedUpdate = buildFamily(
  {
    difficulty: "Advanced",
    mechanic: "update_service",
    description: "The workstation cannot scan or install updates because the Windows Update service is not running.",
    symptoms: [
      "Update checks fail immediately.",
      "The machine is otherwise online.",
      "The issue affects the local update subsystem.",
      "The problem began after service or optimization changes."
    ],
    objective: "Restore the Windows Update service so the workstation can check for and install updates again.",
    diagnosis: "Windows Update service stopped",
    rootCause: "The Windows Update service was disabled or stopped locally.",
    requiredDiagnostics: ["checked_update_service"],
    optimalPath: [
      "Inspect the update service with sc query wuauserv.",
      "Restart the service with restart update service.",
      "Confirm the service now shows running."
    ],
    stateOverrides: {
      updateServiceRunning: false
    }
  },
  [
    { id: "patch-tuesday-service-not-running", title: "Patch Tuesday Service Not Running" },
    { id: "gold-image-disabled-updates", title: "Gold Image Disabled Updates" },
    { id: "maintenance-script-stopped-wuauserv", title: "Maintenance Script Stopped WUAUSERV" },
    { id: "security-scan-found-update-service-off", title: "Security Scan Found Update Service Off" },
    { id: "new-pc-cannot-check-for-updates", title: "New PC Cannot Check For Updates" }
  ]
);

const advancedTimeSkew = buildFamily(
  {
    difficulty: "Advanced",
    mechanic: "time_skew",
    description: "Authentication and secure services are failing because the workstation clock drifted too far from domain time.",
    symptoms: [
      "Secure sites or authentication may fail unexpectedly.",
      "The machine is online but time-sensitive services behave oddly.",
      "The issue began after sleep, travel, or manual clock changes.",
      "The workstation clock is suspected to be inaccurate."
    ],
    objective: "Resynchronize the workstation clock so time-sensitive services can function normally.",
    diagnosis: "Workstation clock skew causing authentication issues",
    rootCause: "The workstation clock drifted outside acceptable tolerance and needed to resync with the domain time source.",
    requiredDiagnostics: ["checked_time_status"],
    optimalPath: [
      "Check current time sync status with w32tm /query /status.",
      "Resync the workstation with w32tm /resync.",
      "Validate the clock is synchronized."
    ],
    stateOverrides: {
      timeSynced: false,
      clockSkewMinutes: 11,
      webReachable: false
    }
  },
  [
    { id: "travel-laptop-clock-drift", title: "Travel Laptop Clock Drift" },
    { id: "vm-resume-time-skew", title: "VM Resume Time Skew" },
    { id: "manual-clock-change-broke-auth", title: "Manual Clock Change Broke Auth" },
    { id: "bios-battery-time-drift", title: "BIOS Battery Time Drift" },
    { id: "conference-room-pc-kerberos-skew", title: "Conference Room PC Kerberos Skew" }
  ]
);

export const scenarioDefinitions = [
  ...beginnerDhcpLease,
  ...beginnerDnsService,
  ...beginnerDnsCache,
  ...beginnerPrintSpooler,
  ...intermediatePerformance,
  ...intermediateLockout,
  ...intermediateFirewall,
  ...intermediateVpn,
  ...intermediateDriveMap,
  ...advancedDhcpService,
  ...advancedProxy,
  ...advancedDisk,
  ...advancedUpdate,
  ...advancedTimeSkew
];
