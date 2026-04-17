/**
 * favorites.js — Módulo de Favoritos
 * Guarda fragmentos, expresiones o números y permite re-inyectarlos en el display.
 */

(function () {
    'use strict';

    const favToggle = document.getElementById('fav-toggle');
    const favSaveBtn = document.getElementById('fav-save-btn');
    const favPanel = document.getElementById('fav-panel');
    const favClose = document.getElementById('fav-close');
    const favBackdrop = document.getElementById('fav-backdrop');
    const favList = document.getElementById('fav-list');
    const favEmpty = document.getElementById('fav-empty');

    if (!favToggle || !favPanel) return;

    let favorites = JSON.parse(localStorage.getItem('calc_favorites') || '[]');

    function saveFavorites() {
        localStorage.setItem('calc_favorites', JSON.stringify(favorites));
        renderFavorites();
    }

    function renderFavorites() {
        favList.innerHTML = '';
        if (favorites.length === 0) {
            favEmpty.style.display = 'block';
            return;
        }
        favEmpty.style.display = 'none';

        favorites.forEach((fav, index) => {
            const item = document.createElement('div');
            item.className = 'stats-card'; // Reuse stats-card styling for simplicity
            item.style.flexDirection = 'row';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.cursor = 'pointer';

            const textWrap = document.createElement('div');
            textWrap.style.overflow = 'hidden';
            
            const title = document.createElement('div');
            title.className = 'stats-card-label';
            title.textContent = fav.name || `Favorito ${index + 1}`;

            const expr = document.createElement('div');
            expr.className = 'stats-card-value';
            expr.style.fontSize = '1.1rem';
            expr.textContent = fav.expression;

            textWrap.appendChild(title);
            textWrap.appendChild(expr);

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '🗑️';
            delBtn.className = 'history-action-btn history-action-danger';
            delBtn.style.padding = '6px';
            delBtn.style.minWidth = '32px';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                favorites.splice(index, 1);
                saveFavorites();
            };

            item.appendChild(textWrap);
            item.appendChild(delBtn);

            item.onclick = () => {
                // inject into calculator
                if (window.calculator) {
                    window.calculator.currentOperand = fav.expression;
                    window.calculator.updateDisplay();
                }
                closePanel();
            };

            favList.appendChild(item);
        });
    }

    function openPanel() {
        renderFavorites();
        favPanel.classList.add('open');
        favBackdrop.classList.add('visible');
    }

    function closePanel() {
        favPanel.classList.remove('open');
        favBackdrop.classList.remove('visible');
    }

    favToggle.addEventListener('click', openPanel);
    favClose.addEventListener('click', closePanel);
    favBackdrop.addEventListener('click', closePanel);

    favSaveBtn.addEventListener('click', () => {
        if (!window.calculator) return;
        const expr = window.calculator.currentOperand;
        if (!expr || expr === '0' || expr.trim() === '') return;
        
        const name = prompt('Nombre para este favorito:', `Valor: ${expr}`);
        if (name !== null) {
            favorites.push({ name: name || 'Sin título', expression: expr });
            saveFavorites();
            
            // Visual feedback
            favSaveBtn.style.transform = 'scale(1.3)';
            favSaveBtn.style.color = '#34d399';
            setTimeout(() => {
                favSaveBtn.style.transform = '';
                favSaveBtn.style.color = '';
            }, 300);
        }
    });

})();
