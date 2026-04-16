import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://localhost:4000/api";
const DIFFICULTY_ORDER = ["Beginner", "Intermediate", "Advanced"];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    const requestError = new Error(error.error || "Request failed");
    requestError.status = response.status;
    throw requestError;
  }

  return response.json();
}

function AnimatedTerminalOutput({ output }) {
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const lines = useMemo(() => output.split("\n"), [output]);

  useEffect(() => {
    setVisibleLineCount(0);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setVisibleLineCount(current);
      if (current >= lines.length) {
        clearInterval(timer);
      }
    }, 36);

    return () => clearInterval(timer);
  }, [lines]);

  return <pre>{lines.slice(0, visibleLineCount).join("\n")}</pre>;
}

function HomePage({ onEnterLab, scenarios, loading }) {
  const homeScrollRef = useRef(null);
  const trainingOverviewRef = useRef(null);
  const scenarioMapRef = useRef(null);
  const [previewTilt, setPreviewTilt] = useState({ rotateX: 4, rotateY: -10 });
  const totalScenarios = scenarios.length;
  const beginnerCount = scenarios.filter((item) => item.difficulty === "Beginner").length;
  const intermediateCount = scenarios.filter((item) => item.difficulty === "Intermediate").length;
  const advancedCount = scenarios.filter((item) => item.difficulty === "Advanced").length;

  const scrollToSection = (sectionRef) => {
    if (!homeScrollRef.current || !sectionRef.current) {
      return;
    }

    const containerTop = homeScrollRef.current.getBoundingClientRect().top;
    const sectionTop = sectionRef.current.getBoundingClientRect().top;
    const nextTop = homeScrollRef.current.scrollTop + (sectionTop - containerTop) - 24;

    homeScrollRef.current.scrollTo({
      top: nextTop,
      behavior: "smooth"
    });
  };

  const handlePreviewPointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const percentX = (event.clientX - bounds.left) / bounds.width;
    const percentY = (event.clientY - bounds.top) / bounds.height;
    const rotateY = -10 + (percentX - 0.5) * 16;
    const rotateX = 4 + (0.5 - percentY) * 14;

    setPreviewTilt({
      rotateX: Math.max(-7, Math.min(11, rotateX)),
      rotateY: Math.max(-18, Math.min(-2, rotateY))
    });
  };

  const handlePreviewPointerLeave = () => {
    setPreviewTilt({ rotateX: 4, rotateY: -10 });
  };

  return (
    <div className="home-shell" ref={homeScrollRef}>
      <div className="home-frame">
        <header className="home-topbar">
          <div>
            <p className="eyebrow">DebugIT</p>
            <h1 className="hero-title">Practice IT troubleshooting like it is happening live.</h1>
          </div>
          <div className="home-cta-group">
            <button className="text-nav-button home-random-button" onClick={() => onEnterLab(true)}>
              Random Lab
            </button>
            <button className="launch-button hero-cta" onClick={() => onEnterLab(false)}>
              Open Lab Console
            </button>
          </div>
        </header>

        <main className="home-content">
          <section className="hero-card panel">
          <div className="hero-copy">
            <span className="hero-kicker">Hands-on Lab Practice</span>
            <p className="hero-lead">
              DebugIT turns IT support training into an active simulation. Instead of reading solutions, you diagnose
              broken systems through a terminal-style workflow and fix issues the way a real technician would.
            </p>
            <div className="hero-actions">
              <button className="launch-button hero-primary" onClick={() => onEnterLab(false)}>
                Start Practicing
              </button>
              <button className="text-nav-button home-random-button" type="button" onClick={() => onEnterLab(true)}>
                Generate Random Lab
              </button>
              <button className="hero-link-button" type="button" onClick={() => scrollToSection(trainingOverviewRef)}>
                Explore Scenarios
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat reveal-delay-1">
                <strong>{loading ? "--" : totalScenarios}</strong>
                <span>lab scenarios</span>
              </div>
              <div className="hero-stat reveal-delay-2">
                <strong>{loading ? "--" : beginnerCount}</strong>
                <span>beginner tracks</span>
              </div>
              <div className="hero-stat reveal-delay-3">
                <strong>{loading ? "--" : intermediateCount + advancedCount}</strong>
                <span>higher-difficulty cases</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div
              className="terminal-preview"
              onPointerMove={handlePreviewPointerMove}
              onPointerLeave={handlePreviewPointerLeave}
              onPointerCancel={handlePreviewPointerLeave}
              style={{
                transform: `perspective(1200px) rotateY(${previewTilt.rotateY}deg) rotateX(${previewTilt.rotateX}deg)`
              }}
            >
              <div className="terminal-toolbar">
                <div className="terminal-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="terminal-title">Simulated Incident Feed</span>
              </div>
              <div className="preview-lines">
                <p className="preview-line">$ ipconfig</p>
                <p className="preview-muted">IPv4 Address . . . . . . : 169.254.88.34</p>
                <p className="preview-line">$ ping google.com</p>
                <p className="preview-warning">Ping request could not find host google.com.</p>
                <p className="preview-line">$ ipconfig /renew</p>
                <p className="preview-success">Successfully renewed the IP lease.</p>
              </div>
            </div>
          </div>
          </section>

          <section className="audience-strip panel">
            <div className="audience-copy">
              <span className="panel-label">Who It Is For</span>
              <h2>Built for aspiring help desk techs, IT students, and anyone training for real support work.</h2>
              <p>
                DebugIT is designed for hands-on learners who want to practice structured troubleshooting, not memorize
                multiple-choice answers. It fits CompTIA-style prep, classroom labs, bootcamps, and self-guided
                practice.
              </p>
            </div>
            <div className="audience-tags">
              <span>CompTIA A+</span>
              <span>Network+</span>
              <span>Help Desk</span>
              <span>Desktop Support</span>
              <span>IT Fundamentals</span>
              <span>Scenario Drills</span>
            </div>
          </section>

          <section className="home-grid" ref={trainingOverviewRef}>
          <article className="feature-card panel reveal-delay-1">
            <span className="panel-label">How It Works</span>
            <h2>Diagnose. Test. Fix. Review.</h2>
            <p>
              Each lab starts with symptoms, not answers. You investigate with realistic commands, apply the right fix,
              and get scored on accuracy and efficiency afterward.
            </p>
          </article>

          <article className="feature-card panel reveal-delay-2">
            <span className="panel-label">Why It Feels Real</span>
            <h2>The system behaves like a machine, not a tutor.</h2>
            <p>
              Outputs change based on hidden system state. If DNS is broken, name lookups fail. If the DHCP client is
              down, renew attempts behave differently than a simple cable issue.
            </p>
          </article>

          <article className="feature-card panel reveal-delay-3">
            <span className="panel-label">Built for Growth</span>
            <h2>Organized by difficulty so learners can level up.</h2>
            <p>
              Move from beginner networking issues into identity, firewall, and layered service failures without losing
              the terminal-first experience.
            </p>
          </article>
          </section>

          <section className="workflow-panel panel">
            <div className="workflow-header">
              <span className="panel-label">Training Workflow</span>
              <h2>Every lab pushes the same real-world troubleshooting loop.</h2>
            </div>
            <div className="workflow-steps">
              <div className="workflow-step reveal-delay-1">
                <strong>1. Observe symptoms</strong>
                <p>Start with the user complaint and visible behavior instead of a revealed answer.</p>
              </div>
              <div className="workflow-step reveal-delay-2">
                <strong>2. Test hypotheses</strong>
                <p>Use commands like `ipconfig`, `ping`, `nslookup`, `tasklist`, and service actions to isolate the failure.</p>
              </div>
              <div className="workflow-step reveal-delay-3">
                <strong>3. Apply the fix</strong>
                <p>Resolve the hidden root cause and watch the simulated system state change in response.</p>
              </div>
              <div className="workflow-step reveal-delay-3">
                <strong>4. Review performance</strong>
                <p>See the diagnosis, optimal path, and how efficient your troubleshooting process actually was.</p>
              </div>
            </div>
          </section>

          <section className="scenario-overview panel" ref={scenarioMapRef}>
          <div className="scenario-overview-header">
            <div>
              <span className="panel-label">Scenario Map</span>
              <h2>Pick a training path and jump into the lab.</h2>
            </div>
            <div className="scenario-overview-actions">
              <button className="text-nav-button home-random-button" onClick={() => onEnterLab(true)}>
                Random Lab
              </button>
              <button className="launch-button hero-secondary" onClick={() => onEnterLab(false)}>
                Go To Labs
              </button>
            </div>
          </div>

          <div className="difficulty-columns">
            {DIFFICULTY_ORDER.map((difficulty) => {
              const items = scenarios.filter((item) => item.difficulty === difficulty);
              if (items.length === 0) {
                return null;
              }

              return (
                <div className="difficulty-column" key={difficulty}>
                  <div className="difficulty-column-head">
                    <span className="difficulty-chip">{difficulty}</span>
                    <strong>{items.length} labs</strong>
                  </div>
                  <ul className="difficulty-list">
                    {items.map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong>
                        <span>{item.objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          </section>

          <section className="outcomes-grid">
            <article className="outcome-card panel">
              <span className="panel-label">What You Practice</span>
              <h2>Thinking in systems, not just commands.</h2>
              <p>
                The goal is to build habits that transfer into real incidents: isolate layers, verify assumptions,
                compare expected versus actual behavior, and document the shortest reliable fix path.
              </p>
            </article>

            <article className="outcome-card panel">
              <span className="panel-label">Why It Helps</span>
              <h2>It trains judgment under uncertainty.</h2>
              <p>
                Real tickets rarely tell you the root cause. DebugIT trains you to move from incomplete symptoms to a
                confident diagnosis using evidence from the environment itself.
              </p>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [scenarios, setScenarios] = useState([]);
  const [currentView, setCurrentView] = useState("home");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [scenario, setScenario] = useState(null);
  const [prompt, setPrompt] = useState("C:\\>");
  const [terminalEntries, setTerminalEntries] = useState([]);
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draftCommand, setDraftCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [pendingSwitchScenarioId, setPendingSwitchScenarioId] = useState("");
  const [pendingSwitchShouldLaunch, setPendingSwitchShouldLaunch] = useState(false);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);
  const launchButtonTimerRef = useRef(null);
  const nextEntryIdRef = useRef(1);
  const [launchCueActive, setLaunchCueActive] = useState(false);

  const resetSessionState = (message) => {
    setSessionId("");
    setScenario(null);
    setPrompt("C:\\>");
    setEvaluation(null);
    setCommand("");
    setCommandHistory([]);
    setHistoryIndex(-1);
    setDraftCommand("");
    if (message) {
      setTerminalEntries((existing) => [
        ...existing,
        {
          id: nextEntryIdRef.current++,
          type: "system",
          command: null,
          output: message
        }
      ]);
    } else {
      setTerminalEntries([]);
    }
  };

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await request("/scenarios");
        setScenarios(data.scenarios);
        if (data.scenarios[0]) {
          setSelectedScenarioId(data.scenarios[0].id);
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadScenarios();
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalEntries, evaluation]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (launchButtonTimerRef.current) {
        clearTimeout(launchButtonTimerRef.current);
      }
    };
  }, []);

  const nudgeLaunchButton = () => {
    if (sessionId || submitting || pendingSwitchScenarioId) {
      return;
    }

    if (launchButtonTimerRef.current) {
      clearTimeout(launchButtonTimerRef.current);
    }

    setLaunchCueActive(true);
    launchButtonTimerRef.current = setTimeout(() => {
      setLaunchCueActive(false);
    }, 520);
  };

  const handleTerminalActivation = () => {
    if (!sessionId) {
      nudgeLaunchButton();
      return;
    }

    inputRef.current?.focus();
  };

  const startScenario = async (scenarioIdOverride = selectedScenarioId) => {
    if (!scenarioIdOverride) {
      return;
    }

    setError("");
    setEvaluation(null);
    setSubmitting(true);
    resetSessionState();

    try {
      const data = await request("/sessions", {
        method: "POST",
        body: JSON.stringify({ scenarioId: scenarioIdOverride })
      });

      setSelectedScenarioId(scenarioIdOverride);
      setSessionId(data.sessionId);
      setScenario(data.scenario);
      setPrompt(data.prompt);
      setTerminalEntries([
        {
          id: nextEntryIdRef.current++,
          type: "system",
          command: null,
          output: data.bootMessage
        }
      ]);
      setCommand("");
    } catch (startError) {
      setError(startError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommandSubmit = async (event) => {
    event.preventDefault();

    if (!sessionId || !command.trim() || submitting || pendingSwitchScenarioId) {
      return;
    }

    const currentCommand = command;
    setCommand("");
    setDraftCommand("");
    setHistoryIndex(-1);
    setSubmitting(true);
    setError("");
    setCommandHistory((existing) => [...existing, currentCommand]);

    try {
      const data = await request(`/sessions/${sessionId}/command`, {
        method: "POST",
        body: JSON.stringify({ command: currentCommand })
      });

      if (data.output === "__CLEAR__") {
        setTerminalEntries([]);
      } else {
        setTerminalEntries((existing) => [
          ...existing,
          {
            id: nextEntryIdRef.current++,
            type: "command",
            prompt: data.prompt,
            command: data.command,
            output: data.output
          }
        ]);
      }

      setPrompt(data.prompt);
      if (data.completed) {
        setEvaluation(data.evaluation);
      }
    } catch (submitError) {
      if (submitError.status === 404) {
        resetSessionState(
          "Simulation session expired or was reset on the server. Launch the scenario again to continue."
        );
        setError("Simulation session expired. Relaunch the scenario.");
      } else {
        setError(submitError.message);
      }
    } finally {
      setSubmitting(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleCommandKeyDown = (event) => {
    if (pendingSwitchScenarioId) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (commandHistory.length === 0) {
        return;
      }

      if (historyIndex === -1) {
        setDraftCommand(command);
        setHistoryIndex(commandHistory.length - 1);
        setCommand(commandHistory[commandHistory.length - 1]);
        return;
      }

      const nextIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCommand(commandHistory[nextIndex]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (commandHistory.length === 0 || historyIndex === -1) {
        return;
      }

      if (historyIndex >= commandHistory.length - 1) {
        setHistoryIndex(-1);
        setCommand(draftCommand);
        return;
      }

      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCommand(commandHistory[nextIndex]);
    }
  };

  const handleScenarioSelection = (nextScenarioId) => {
    if (!sessionId || !scenario?.id || nextScenarioId === scenario.id) {
      setSelectedScenarioId(nextScenarioId);
      return;
    }

    setPendingSwitchShouldLaunch(false);
    setPendingSwitchScenarioId(nextScenarioId);
  };

  const handleCancelScenarioSwitch = () => {
    setPendingSwitchScenarioId("");
    setPendingSwitchShouldLaunch(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleConfirmScenarioSwitch = async () => {
    const nextScenarioId = pendingSwitchScenarioId;
    const shouldLaunch = pendingSwitchShouldLaunch;
    setPendingSwitchScenarioId("");
    setPendingSwitchShouldLaunch(false);
    resetSessionState();
    if (shouldLaunch) {
      await startScenario(nextScenarioId);
      return;
    }

    setSelectedScenarioId(nextScenarioId);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const getRandomScenarioId = () => {
    if (scenarios.length === 0) {
      return "";
    }

    const pool =
      scenarios.length > 1 && selectedScenarioId
        ? scenarios.filter((entry) => entry.id !== selectedScenarioId)
        : scenarios;
    const source = pool.length > 0 ? pool : scenarios;
    const index = Math.floor(Math.random() * source.length);
    return source[index]?.id ?? "";
  };

  const launchRandomScenario = async () => {
    const randomScenarioId = getRandomScenarioId();
    if (!randomScenarioId) {
      return;
    }

    setCurrentView("lab");

    if (sessionId && scenario?.id && randomScenarioId !== scenario.id) {
      setPendingSwitchShouldLaunch(true);
      setPendingSwitchScenarioId(randomScenarioId);
      return;
    }

    await startScenario(randomScenarioId);
  };

  const enterLabView = async (startRandom = false) => {
    setCurrentView("lab");
    if (startRandom) {
      await launchRandomScenario();
      return;
    }

    requestAnimationFrame(() => {
      if (sessionId) {
        inputRef.current?.focus();
      }
    });
  };

  const activeScenario = scenarios.find((entry) => entry.id === selectedScenarioId) ?? scenario;
  const groupedScenarios = DIFFICULTY_ORDER.map((difficulty) => ({
    difficulty,
    items: scenarios.filter((item) => item.difficulty === difficulty)
  })).filter((group) => group.items.length > 0);

  if (currentView === "home") {
    return <HomePage onEnterLab={enterLabView} scenarios={scenarios} loading={loading} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DebugIT</p>
          <h1>Interactive IT Troubleshooting Simulator</h1>
        </div>
        <div className="topbar-actions">
          <button className="text-nav-button" onClick={() => setCurrentView("home")}>
            Home
          </button>
          <button className="text-nav-button" onClick={launchRandomScenario} disabled={submitting || !scenarios.length}>
            Random Scenario
          </button>
          <button
            className={`launch-button ${launchCueActive ? "launch-button-cue" : ""}`}
            onClick={() => startScenario()}
            disabled={!selectedScenarioId || submitting || Boolean(pendingSwitchScenarioId)}
          >
            {sessionId ? "Restart Scenario" : "Launch Scenario"}
          </button>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <main className="workspace">
        <section className="panel scenario-panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">Scenario</span>
              {activeScenario?.difficulty ? (
                <div className="difficulty-chip">{activeScenario.difficulty}</div>
              ) : null}
            </div>
            <select
              className="scenario-select"
              value={selectedScenarioId}
              onChange={(event) => handleScenarioSelection(event.target.value)}
              disabled={loading || submitting || Boolean(pendingSwitchScenarioId)}
            >
              {groupedScenarios.map((group) => (
                <optgroup key={group.difficulty} label={group.difficulty}>
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {activeScenario ? (
            <>
              <h2>{activeScenario.title}</h2>
              <p className="scenario-description">{activeScenario.description}</p>

              <div className="info-card">
                <h3>Symptoms</h3>
                <ul>
                  {activeScenario.symptoms.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>

              <div className="info-card">
                <h3>Objective</h3>
                <p>{activeScenario.objective}</p>
              </div>

              <div className="info-card">
                <h3>Mission Rules</h3>
                <ul>
                  <li>Diagnose first, then change the system state.</li>
                  <li>Use realistic CLI commands rather than guessing the fix.</li>
                  <li>The simulator responds like a live workstation, not a tutor.</li>
                </ul>
              </div>
            </>
          ) : (
            <p>Loading scenarios...</p>
          )}

          {evaluation ? (
            <div className="results-card">
              <span className="status-pill">Scenario Resolved</span>
              <h3>Score: {evaluation.score} / 100</h3>
              <p className="level-text">{evaluation.level} troubleshooting level</p>
              <p>
                <strong>Diagnosis:</strong> {evaluation.diagnosis}
              </p>
              <p>
                <strong>Root Cause:</strong> {evaluation.rootCause}
              </p>

              <div className="results-group">
                <h4>Feedback</h4>
                <ul>
                  {evaluation.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="results-group">
                <h4>Optimal Path</h4>
                <ol>
                  {evaluation.optimalPath.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="results-group">
                <h4>Your Command Trail</h4>
                <ul>
                  {evaluation.userPath.map((step, index) => (
                    <li key={`${step}-${index}`}>{step}</li>
                  ))}
                </ul>
              </div>

              {evaluation.mistakes.length > 0 ? (
                <div className="results-group">
                  <h4>Missed Opportunities</h4>
                  <ul>
                    {evaluation.mistakes.map((mistake) => (
                      <li key={mistake}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section
          className="panel terminal-panel"
          onClick={handleTerminalActivation}
        >
          <div className="terminal-toolbar">
            <div className="terminal-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="terminal-title">Live System Console</span>
          </div>

          <div className="terminal-history" onClick={handleTerminalActivation}>
            {terminalEntries.length === 0 ? (
              <div className="terminal-placeholder">
                <p>Scenario output will appear here.</p>
                <p>Start the simulation, then try commands like `ipconfig`, `ping 8.8.8.8`, or `ipconfig /renew`.</p>
              </div>
            ) : null}

            {terminalEntries.map((entry, index) => (
              <div className="terminal-entry" key={entry.id ?? `${entry.command}-${index}`}>
                {entry.command ? (
                  <div className="terminal-command">
                    <span className="terminal-prompt">{entry.prompt}</span>
                    <span>{entry.command}</span>
                  </div>
                ) : null}
                <AnimatedTerminalOutput output={entry.output} />
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          <form className="terminal-input-row" onSubmit={handleCommandSubmit} onClick={handleTerminalActivation}>
            <label className="terminal-prompt" htmlFor="terminal-command">
              {prompt}
            </label>
            <input
              id="terminal-command"
              ref={inputRef}
              autoComplete="off"
              spellCheck="false"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={handleCommandKeyDown}
              placeholder={sessionId ? "Enter command" : "Launch a scenario to begin"}
              disabled={!sessionId || submitting || Boolean(pendingSwitchScenarioId)}
              onClick={handleTerminalActivation}
            />
          </form>
        </section>
      </main>

      {pendingSwitchScenarioId ? (
        <div className="modal-overlay" role="presentation">
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="switch-lab-title">
            <p className="panel-label">Confirm Switch</p>
            <h2 id="switch-lab-title">Leave current lab and switch scenarios?</h2>
            <p className="modal-copy">
              You have an active lab in progress. If you switch now, the current terminal history and progress will be
              cleared.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button secondary" onClick={handleCancelScenarioSwitch}>
                Cancel
              </button>
              <button type="button" className="modal-button primary" onClick={handleConfirmScenarioSwitch}>
                End and Switch
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
