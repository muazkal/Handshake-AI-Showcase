# DebugIT

DebugIT is a full-stack web application that simulates realistic IT troubleshooting scenarios through a browser-based terminal. Instead of acting like a tutor or quiz, the system behaves like a live workstation with a hidden fault that users must diagnose and fix step-by-step.

## Included Scenarios

### Beginner

- `No Internet Connection` - DHCP/APIPA failure
- `DNS Resolution Failure` - valid IP, broken DNS client service
- `Slow System Performance` - runaway CPU process

### Intermediate

- `Stale DNS Cache` - cached hostname resolution issue fixed with `ipconfig /flushdns`
- `Login Authentication Failure` - locked domain account
- `Firewall Blocking Traffic` - outbound HTTPS blocked locally

### Advanced

- `DHCP Client Service Stopped` - service restart required before lease renewal

## MVP Included

- React terminal interface with scenario briefing and symptoms panel
- Scenario selector grouped by difficulty level
- Express backend with in-memory session handling
- Stateful command simulator for networking, authentication, firewall, and process troubleshooting commands
- Completion scoring, troubleshooting level, and feedback summary

## Project Structure

```text
debugit/
  client/      React + Vite frontend
  server/      Express API + scenario engine
  package.json Root scripts for local development
```

## Run Locally

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Start the app in development mode:

```bash
npm run dev
```

3. Open the frontend at [http://localhost:5173](http://localhost:5173)

The frontend talks to the backend API at `http://localhost:4000`.

## Gameplay Flow

1. Launch the scenario.
2. Read the symptoms and objective.
3. Use realistic commands in the terminal to inspect the machine state.
4. Apply the correct fix.
5. Review your score, diagnosis, root cause, and optimal path.

## Example Commands

```text
ipconfig
ping 8.8.8.8
ping google.com
nslookup google.com
netstat
ipconfig /renew
restart dns service
tasklist
taskkill /im backup-agent.exe /f
whoami
net user trainee /domain
unlock account trainee
curl https://support.corp
netsh advfirewall reset
```

## Notes

- Sessions are stored in memory for the MVP, so restarting the server resets all active simulations.
- The architecture is ready for more scenarios to be added in `server/src/scenarios.js`.
- Optional LLM integration can be layered into the command interpreter later, but the current simulator already enforces non-chatbot behavior by returning system-like outputs only.
