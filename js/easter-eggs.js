/**
 * easter-eggs.js — Improvement #36
 * Fun reward animations and secret messages.
 *
 * Triggers:
 *  - Result === 42      → "La respuesta a todo"
 *  - Result === 0       → "El vacío..." 
 *  - Division by zero message replaced by custom fun toast (handled in script.js)
 *  - Result is a round 100/1000/etc → Confetti burst
 *  - Secret: type "1337" → "Eres un hacker"
 *  - Secret: type "pi" button 3x → show Pi digits
 */
(function () {

    /* ── Confetti ──────────────────────────────────────────────────────────── */
    function launchConfetti() {
        const COLORS = ['#a855f7', '#38bdf8', '#34d399', '#fb7185', '#fbbf24'];
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            pointer-events:none; z-index:99998;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: -10,
            r: 4 + Math.random() * 6,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 4,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.2,
            opacity: 1,
        }));

        let frame;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.12;
                p.angle += p.spin;
                p.opacity -= 0.008;
                if (p.opacity > 0) { alive = true; }

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
                ctx.restore();
            });

            if (alive) {
                frame = requestAnimationFrame(draw);
            } else {
                canvas.remove();
            }
        }
        frame = requestAnimationFrame(draw);
        setTimeout(() => { cancelAnimationFrame(frame); canvas.remove(); }, 4500);
    }

    /* ── Egg messages ──────────────────────────────────────────────────────── */
    const eggMessages = {
        42:    { msg: '¡La respuesta a la vida, el universo y todo lo demás!', type: 'info' },
        0:     { msg: 'El vacío... 🌌', type: 'info' },
        1337:  { msg: 'l33t h4x0r detectado 🖤', type: 'success' },
        69:    { msg: '¿En serio? 😏', type: 'info' },
        666:   { msg: '😈 Número del diablo detectado', type: 'error' },
        9001:  { msg: '¡Es más de 9000! 💥', type: 'success' },
        3.14159: { msg: 'π encontrado 🥧', type: 'info' },
    };

    const ROUND_MILESTONES = [100, 500, 1000, 5000, 10000, 100000];

    /* ── Public hook: call after every equals computation ─────────────────── */
    window.checkEasterEgg = function (result) {
        const num = parseFloat(result);
        if (isNaN(num)) return;

        // Specific number eggs
        const egg = eggMessages[num] || eggMessages[Math.round(num * 100000) / 100000];
        if (egg && window.showToast) {
            showToast(egg.msg, egg.type);
        }

        // Round milestone → confetti
        if (ROUND_MILESTONES.includes(Math.abs(num))) {
            launchConfetti();
            if (window.showToast) showToast('🎉 ¡Número redondo!', 'success');
        }

        // Negative result flash
        if (num < 0 && window.showToast && Math.random() < 0.05) {
            showToast('Resultado negativo 😬', 'info');
        }
    };

    /* ── Secret keyboard combo: type "1337" in succession ─────────────────── */
    let secretBuffer = '';
    document.addEventListener('keydown', e => {
        secretBuffer += e.key;
        if (secretBuffer.length > 6) secretBuffer = secretBuffer.slice(-6);
        if (secretBuffer.includes('1337')) {
            launchConfetti();
            if (window.showToast) showToast('🔓 Código secreto: ¡l33t h4x0r!', 'success');
            secretBuffer = '';
        }
    });

})();
