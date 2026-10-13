function arfaCapital(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

let C, actBtns, scenes, sceneIndex = 0, stop=false, isLooping=false, firstCycleDone=false;

function init(){
  C = document.getElementById("terminalContent");
  actBtns = document.getElementById("arfaActions");
  if (!C) return;

  const glow = document.createElement("div");
  glow.style.cssText = "position:absolute;inset:0;background:radial-gradient(ellipse 65% 55% at 50% 50%, rgba(120,80,200,0.22), transparent 70%);pointer-events:none;z-index:-1;";
  const term = document.getElementById("arfaTerminal");
  if (term) { term.style.overflow="visible"; }

  const captions = ["Programming", "Economics", "Marketing", "Quality", "Design", "Launch"];
  let currentCaption = null;

  function setCaption(txt) {
    if (currentCaption) currentCaption.remove();
    currentCaption = document.createElement("div");
    currentCaption.className = "arfa-terminal__line arfa-terminal__accent";
    currentCaption.style.cssText = "margin-top:1.1rem;font-size:1.05rem;font-weight:700;letter-spacing:0.02em;opacity:0.85;";
    currentCaption.innerHTML = "—" + txt + "—";
    C.appendChild(currentCaption);
  }

  function clearLines(){
    C.innerHTML = "";
  }

  function addLine(text, cls) {
    const p = document.createElement("p");
    p.className = "arfa-terminal__line" + (cls ? " " + cls : "");
    p.innerHTML = text;
    C.appendChild(p);
    C.scrollTop = C.scrollHeight;
  }

  function typeLine(text, cls, cb, perChar=30) {
    const p = document.createElement("p");
    p.className = "arfa-terminal__line" + (cls ? " " + cls : "");
    C.appendChild(p);
    let i = 0;
    const span = document.createElement("strong");
    p.appendChild(span);
    function step() {
      if (stop) return;
      if (i < text.length) {
        span.textContent = text.substring(0, i+1);
        i++;
        if (i < text.length) {
          setTimeout(step, Math.random() < 0.03 ? 90 : perChar);
        } else {
          setTimeout(() => cb && cb(), 350);
        }
      } else {
        setTimeout(() => cb && cb(), 200);
      }
    }
    setTimeout(step, perChar);
  }

  function modVal(start, end, duration, onTick) {
    let s = null;
    function anim(t){
      if (s===null) s=t;
      const pct = Math.min(1, (t-s)/duration);
      const value = (start + (end-start)*pct).toFixed(1);
      onTick(value, pct);
      if (pct < 1) requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  scenes = [
    // 1. Programming
    (cb) => {
      setCaption("Programming");
      typeLine("> build.product()", "arfa-terminal__dim", () => {
        setTimeout(() => {
          addLine("Compiling modules...", "arfa-terminal__output");
          setTimeout(() => {
            addLine("✓ Build successful", "arfa-terminal__success");
            setTimeout(() => {
              addLine("", "");
              typeLine("> deploy()", "arfa-terminal__command", () => {
                setTimeout(() => cb(), 1200);
              });
            }, 600);
          }, 900);
        }, 500);
      }, 28);
    },
    // 2. Economics
    (cb) => {
      setCaption("Economics");
      addLine("MARKET INDEX  <span class='arfa-terminal__value'>+12.8%</span>", "");
      modVal(0, 12.8, 1800, (v, p) => {
        const row = document.querySelector("#marketIndex");
        if (!row) {
          const el = document.createElement("p");
          el.id = "marketIndex";
          el.className = "arfa-terminal__label";
          el.innerHTML = "MARKET INDEX  <span class='arfa-terminal__value'>+" + v + "%</span>";
          // remove earlier non-numbered
          const prev = document.querySelectorAll("#marketIndex");
          prev.forEach(x => x.remove());
          C.querySelector(".arfa-terminal__line:nth-child(2)") ? C.replaceChild(el, C.children[1]) : C.appendChild(el);
        } else {
          row.innerHTML = "MARKET INDEX  <span class='arfa-terminal__value'>+" + v + "%</span>";
        }
      });
      setTimeout(() => { addLine("DEMAND       <span class='arfa-terminal__value'>↑ 24.6%</span>", ""); }, 600);
      setTimeout(() => { addLine("REVENUE      <span class='arfa-terminal__value'>↗</span>", ""); }, 1200);
      setTimeout(() => cb(), 2600);
    },
    // 3. Marketing
    (cb) => {
      setCaption("Marketing");
      addLine("CAMPAIGN launched", "arfa-terminal__accent");
      setTimeout(() => {
        typeLine("CTR  3.2 → 5.7", "arfa-terminal__value", () => {
          setTimeout(() => {
            const l = addLine("AUDIENCE matched ✓", "arfa-terminal__success");
            setTimeout(() => cb(), 1500);
          }, 500);
        }, 40);
      }, 600);
    },
    // 4. QA
    (cb) => {
      setCaption("Quality");
      addLine("TESTING suites...", "arfa-terminal__output");
      setTimeout(() => {
        addLine("  unit...        ✓", "arfa-terminal__success");
        setTimeout(() => {
          addLine("  widget...       ✓", "arfa-terminal__success");
          setTimeout(() => {
            addLine("  integration... ✓", "arfa-terminal__success");
            setTimeout(() => {
              addLine("", "");
              addLine("All tests passed", "arfa-terminal__success");
              setTimeout(() => cb(), 1400);
            }, 600);
          }, 600);
        }, 600);
      }, 700);
    },
    // 5. Design
    (cb) => {
      setCaption("Design");
      typeLine("figma.export('product')", "arfa-terminal__command", () => {
        setTimeout(() => {
          addLine("Generating assets...", "arfa-terminal__output");
          setTimeout(() => {
            addLine("· 24 components", "arfa-terminal__value");
            setTimeout(() => {
              addLine("· 7 screens", "arfa-terminal__value");
              setTimeout(() => {
                addLine("Design ready", "arfa-terminal__success");
                setTimeout(() => cb(), 1300);
              }, 500);
            }, 500);
          }, 600);
        }, 600);
      }, 26);
    },
    // 6. Launch
    (cb) => {
      setCaption("Launch");
      typeLine("publish()", "arfa-terminal__command", () => {
        setTimeout(() => {
          addLine("✓ Released v2.4", "arfa-terminal__success");
          setTimeout(() => {
            addLine("audience: 12,400", "arfa-terminal__value");
            setTimeout(() => {
              addLine("", "");
              addLine("Done. Enjoy.", "arfa-terminal__dim");
              cb();
            }, 800);
          }, 600);
        }, 700);
      }, 30);
    }
  ];

  function runNext() {
    if (stop) return;
    clearLines();
    const s = scenes[sceneIndex % scenes.length];
    s(() => {
      setTimeout(() => {
        sceneIndex++;
        if (sceneIndex >= scenes.length && !firstCycleDone) {
          firstCycleDone = true;
          if (actBtns) actBtns.style.display = "flex";
        }
        runNext();
      }, 500);
    });
  }

  runNext();
}

document.addEventListener("DOMContentLoaded", init);
function stopLoop(){ stop=true; }