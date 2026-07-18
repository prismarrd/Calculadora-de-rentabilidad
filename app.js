document.addEventListener('DOMContentLoaded', () => {
    // --- State & DOM Elements ---
    let myChart = null;

    // Inputs
    const elements = {
        name: document.getElementById('product-name'),
        provider: document.getElementById('provider-name'),
        costProduct: document.getElementById('cost-product'),
        costSupplierShipping: document.getElementById('cost-supplier-shipping'),
        costAds: document.getElementById('cost-ads'),
        costPackaging: document.getElementById('cost-packaging'),
        costOther: document.getElementById('cost-other'),
        costCustomerShipping: document.getElementById('cost-customer-shipping'),
        salePrice: document.getElementById('sale-price'),
        targetMargin: document.getElementById('target-margin'),
        salesGoal: document.getElementById('sales-goal'),
        offerPrice: document.getElementById('offer-price')
    };

    // Summary Elements
    const summary = {
        totalCost: document.getElementById('summary-total-cost'),
        salePrice: document.getElementById('summary-sale-price'),
        profit: document.getElementById('summary-profit'),
        margin: document.getElementById('summary-margin'),
        roi: document.getElementById('summary-roi'),
        multiplier: document.getElementById('summary-multiplier'),
        profitCard: document.getElementById('profit-card'),
        marginCard: document.getElementById('margin-card')
    };

    // Formatter
    const formatMoney = (amount) => `RD$${Math.round(amount).toLocaleString('en-US')}`;
    const formatPercent = (percent) => `${percent.toFixed(1)}%`;

    // --- Core Calculation Logic ---
    function calculate() {
        const cProduct = parseFloat(elements.costProduct.value) || 0;
        const cSupShip = parseFloat(elements.costSupplierShipping.value) || 0;
        const cAds = parseFloat(elements.costAds.value) || 0;
        const cPack = parseFloat(elements.costPackaging.value) || 0;
        const cOther = parseFloat(elements.costOther.value) || 0;
        const cCusShip = parseFloat(elements.costCustomerShipping.value) || 0;
        
        let salePrice = parseFloat(elements.salePrice.value) || 0;
        const targetMargin = parseFloat(elements.targetMargin.value) || 40;

        const totalCost = cProduct + cSupShip + cAds + cPack + cOther + cCusShip;
        const profit = salePrice - totalCost;
        const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        const multiplier = totalCost > 0 ? (salePrice / totalCost).toFixed(1) : 0;

        updateUI(totalCost, salePrice, profit, margin, roi, multiplier, targetMargin);
        updateChart(totalCost, profit);
        updateRecommendations(margin, profit, cAds, cCusShip, salePrice, targetMargin);
        updateDiscountSimulator(salePrice, totalCost);
        updateOffer2x(cProduct, cSupShip, cAds, cPack, cOther, cCusShip, salePrice);
        updateBreakeven(profit);
        updateSmartTools(totalCost, cCusShip, targetMargin, salePrice);
    }

    function updateUI(totalCost, salePrice, profit, margin, roi, multiplier, targetMargin) {
        summary.totalCost.textContent = formatMoney(totalCost);
        summary.salePrice.textContent = formatMoney(salePrice);
        summary.profit.textContent = formatMoney(profit);
        summary.margin.textContent = formatPercent(margin);
        summary.roi.textContent = `${formatPercent(roi)} `;
        summary.multiplier.textContent = `(x${multiplier})`;

        // Status Evaluation
        let statusClass = 'status-red';
        let statusText = 'No Recomendado';
        let badgeClass = 'bg-red';
        let msg = 'Margen muy bajo. Peligro de pérdidas.';
        let markerPos = Math.min(Math.max(margin, 0), 100); // For speedometer

        if (margin >= 50) {
            statusClass = 'status-blue';
            statusText = 'Muy Rentable';
            badgeClass = 'bg-blue';
            msg = 'Excelente margen. Ideal para escalar.';
        } else if (margin >= 35) {
            statusClass = 'status-green';
            statusText = 'Rentable';
            badgeClass = 'bg-green';
            msg = 'Buen margen. Negocio sano.';
        } else if (margin >= 20) {
            statusClass = 'status-yellow';
            statusText = 'Aceptable';
            badgeClass = 'bg-yellow';
            msg = 'Margen ajustado. Cuidado con los costos ocultos.';
        }

        // Apply classes to cards
        ['status-red', 'status-yellow', 'status-green', 'status-blue'].forEach(c => {
            summary.profitCard.classList.remove(c);
            summary.marginCard.classList.remove(c);
        });
        
        summary.profitCard.classList.add(statusClass);
        summary.marginCard.classList.add(statusClass);

        // Update Indicator
        const badge = document.getElementById('status-badge');
        badge.className = `status-badge ${badgeClass}`;
        badge.textContent = statusText;
        document.getElementById('indicator-message').textContent = msg;
        
        // Marker on Speedometer (0-20, 20-35, 35-50, 50-100) mapping to 0-100% width
        // Red: 0-20%, Yellow: 20-35%, Green: 35-50%, Blue: 50%+
        // Visually the bar is: 20% red, 15% yellow, 15% green, 50% blue
        let visualPos = 0;
        if(margin <= 0) visualPos = 0;
        else if(margin < 20) visualPos = margin; // 0 to 20
        else if(margin < 35) visualPos = 20 + ((margin - 20) / 15) * 15;
        else if(margin < 50) visualPos = 35 + ((margin - 35) / 15) * 15;
        else visualPos = 50 + ((margin - 50) / 50) * 50;
        
        visualPos = Math.min(visualPos, 100);
        document.getElementById('speedometer-marker').style.left = `${visualPos}%`;
    }

    // --- Recommendations ---
    function updateRecommendations(margin, profit, ads, shipping, salePrice, targetMargin) {
        const list = document.getElementById('recommendation-list');
        list.innerHTML = '';
        
        if (salePrice === 0) {
            list.innerHTML = '<li class="reco-item reco-neutral">✅ Ingresa el precio de venta para generar recomendaciones.</li>';
            return;
        }

        const addReco = (type, text) => {
            let icon = type === 'positive' ? '✅' : (type === 'warning' ? '⚠️' : '❌');
            list.innerHTML += `<li class="reco-item reco-${type}">${icon} ${text}</li>`;
        };

        if (margin >= targetMargin) {
            addReco('positive', `Superas tu margen objetivo del ${targetMargin}%. Este producto tiene potencial para escalar en publicidad.`);
        } else if (margin > 0) {
            addReco('warning', `Tu margen (${formatPercent(margin)}) está por debajo de tu objetivo (${targetMargin}%). Considera subir el precio o reducir costos.`);
        } else {
            addReco('negative', 'Estás perdiendo dinero con cada venta. Revisa urgente tu estructura de costos.');
        }

        if (ads > profit && profit > 0) {
            addReco('warning', 'El costo de publicidad es más alto que tu ganancia neta. Intenta optimizar tus campañas.');
        }

        if (shipping > (salePrice * 0.15)) {
            addReco('warning', 'El envío consume más del 15% de tu precio de venta. Evalúa negociar tarifas o pasarlo al cliente.');
        }

        if (margin >= 35) {
            addReco('positive', `Una oferta de 2 unidades podría aumentar tus ganancias absolutas sin sacrificar viabilidad.`);
        }
    }

    // --- Discount Simulator ---
    const discountBtns = document.querySelectorAll('.discount-btn');
    discountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            discountBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            calculate(); // trigger recalc to update discount UI
        });
    });

    function updateDiscountSimulator(salePrice, totalCost) {
        const activeBtn = document.querySelector('.discount-btn.active');
        const discountPercent = activeBtn ? parseInt(activeBtn.dataset.discount) : 0;
        
        const simContainer = document.getElementById('simulated-result');
        if (discountPercent === 0 || salePrice === 0) {
            simContainer.style.display = 'none';
            return;
        }
        
        simContainer.style.display = 'block';
        
        const newPrice = salePrice * (1 - (discountPercent/100));
        const newProfit = newPrice - totalCost;
        const newMargin = newProfit / newPrice * 100;
        
        document.getElementById('sim-price').textContent = formatMoney(newPrice);
        document.getElementById('sim-profit').textContent = formatMoney(newProfit);
        document.getElementById('sim-margin').textContent = formatPercent(newMargin);
        
        const alertBox = document.getElementById('sim-alert');
        if (newMargin < 20) {
            alertBox.className = 'alert bg-red text-danger';
            alertBox.textContent = '¡Cuidado! Este descuento destruye tu rentabilidad.';
        } else {
            alertBox.className = 'alert bg-green text-success';
            alertBox.textContent = 'Aún mantienes un margen aceptable.';
        }
    }

    // --- Smart Calculators ---
    function updateSmartTools(totalCost, customerShipping, targetMargin, currentPrice) {
        // Free shipping calc (Cost without shipping + shipping = new baseline)
        // If we want to absorb shipping and KEEP the current margin %, what should price be?
        // Current margin % = (P - C)/P = 1 - C/P => P = C / (1 - margin%)
        const currentMarginDec = currentPrice > 0 ? ((currentPrice - totalCost) / currentPrice) : (targetMargin/100);
        
        // Target Price to hit target Margin
        let targetPrice = 0;
        if(targetMargin < 100) {
            targetPrice = totalCost / (1 - (targetMargin/100));
        }
        document.getElementById('tool-target-margin-display').textContent = `${targetMargin}%`;
        document.getElementById('tool-target-price').textContent = formatMoney(targetPrice);

        // Free shipping
        document.getElementById('tool-shipping-cost').textContent = formatMoney(customerShipping);
        let freeShipPrice = 0;
        // If they want to keep the TARGET margin while absorbing shipping:
        if(targetMargin < 100) {
            freeShipPrice = totalCost / (1 - (targetMargin/100)); // Total cost already includes customer shipping based on input
        }
        document.getElementById('tool-free-shipping-price').textContent = formatMoney(freeShipPrice);
    }

    document.getElementById('apply-target-price').addEventListener('click', () => {
        const cost = Array.from(Object.values(elements)).slice(2, 9).reduce((acc, el) => acc + (parseFloat(el.value)||0), 0);
        const targetMargin = parseFloat(elements.targetMargin.value) || 40;
        if(targetMargin < 100) {
            elements.salePrice.value = Math.round(cost / (1 - (targetMargin/100)));
            calculate();
        }
    });

    document.getElementById('apply-free-shipping-price').addEventListener('click', () => {
         const targetMargin = parseFloat(elements.targetMargin.value) || 40;
         const cost = Array.from(Object.values(elements)).slice(2, 9).reduce((acc, el) => acc + (parseFloat(el.value)||0), 0);
         if(targetMargin < 100) {
            elements.salePrice.value = Math.round(cost / (1 - (targetMargin/100)));
            calculate();
         }
    });

    // --- Offer 2x Simulator ---
    let lastSuggestedOfferPrice = 0;

    function updateOffer2x(cProduct, cSupShip, cAds, cPack, cOther, cCusShip, baseSalePrice) {
        const baseTotalCost = cProduct + cSupShip + cAds + cPack + cOther + cCusShip;
        const profit1 = baseSalePrice - baseTotalCost;
        const simpleCost2x = (cProduct * 2) + (cSupShip * 2) + cAds + (cPack * 1.2) + cOther + cCusShip; // Ads once per order
        
        let suggestedPrice = 0;
        if (baseSalePrice > 0) {
            const targetProfit2x = profit1 > 0 ? profit1 * 1.5 : 500;
            suggestedPrice = simpleCost2x + targetProfit2x;
            if (suggestedPrice <= baseSalePrice) {
                suggestedPrice = baseSalePrice * 1.5;
            }
            suggestedPrice = Math.round(suggestedPrice);
            lastSuggestedOfferPrice = suggestedPrice;
            document.getElementById('offer-suggestion-text').innerHTML = `Precio Sugerido: <strong class="text-primary">${formatMoney(suggestedPrice)}</strong>`;
            document.getElementById('btn-apply-offer-suggestion').style.display = 'inline-block';
        } else {
            document.getElementById('offer-suggestion-text').textContent = 'Ingresa el precio de venta (1 Und).';
            document.getElementById('btn-apply-offer-suggestion').style.display = 'none';
        }

        let offerPrice = parseFloat(elements.offerPrice.value);
        if (!offerPrice && suggestedPrice > 0) {
            // Auto-fill initial suggestion if empty
            offerPrice = suggestedPrice;
            elements.offerPrice.value = offerPrice;
        } else if (baseSalePrice === 0) {
            offerPrice = 0;
            elements.offerPrice.value = '';
        }

        const profit2x = offerPrice - simpleCost2x;
        const margin2x = offerPrice > 0 ? (profit2x / offerPrice) * 100 : 0;

        document.getElementById('offer-revenue').textContent = formatMoney(offerPrice);
        document.getElementById('offer-cost').textContent = formatMoney(simpleCost2x);
        document.getElementById('offer-profit').textContent = formatMoney(profit2x);
        document.getElementById('offer-margin').textContent = formatPercent(margin2x);
        document.getElementById('offer-profit').className = profit2x > 0 ? 'text-success' : 'text-danger';
    }

    document.getElementById('btn-apply-offer-suggestion').addEventListener('click', () => {
        if (lastSuggestedOfferPrice > 0) {
            elements.offerPrice.value = lastSuggestedOfferPrice;
            calculate();
        }
    });

    // --- Break Even ---
    function updateBreakeven(unitProfit) {
        const goal = parseFloat(elements.salesGoal.value) || 0;
        document.getElementById('display-goal').textContent = goal.toLocaleString('en-US');
        const units = unitProfit > 0 ? Math.ceil(goal / unitProfit) : 0;
        document.getElementById('units-needed').textContent = units;
    }

    // --- Charts ---
    function updateChart(cost, profit) {
        const ctx = document.getElementById('profitChart').getContext('2d');
        const data = [Math.max(cost, 0), Math.max(profit, 0)];
        
        if (myChart) {
            myChart.data.datasets[0].data = data;
            myChart.update();
        } else {
            myChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Costo Total', 'Ganancia Neta'],
                    datasets: [{
                        data: data,
                        backgroundColor: ['#6B7280', '#007BFF'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    // --- Event Listeners for reactivity ---
    Object.values(elements).forEach(el => {
        if(el) {
            el.addEventListener('input', calculate);
        }
    });



    // --- Local Storage: Defaults ---
    document.getElementById('save-defaults-btn').addEventListener('click', () => {
        const defaults = {
            packaging: elements.costPackaging.value,
            ads: elements.costAds.value,
            shipping: elements.costCustomerShipping.value
        };
        localStorage.setItem('prismar_defaults', JSON.stringify(defaults));
        alert('Valores por defecto guardados exitosamente.');
    });

    function loadDefaults() {
        const defaults = JSON.parse(localStorage.getItem('prismar_defaults'));
        if (defaults) {
            elements.costPackaging.value = defaults.packaging || 0;
            elements.costAds.value = defaults.ads || 0;
            elements.costCustomerShipping.value = defaults.shipping || 0;
        }
    }

    // --- Local Storage: History ---
    function saveToHistory() {
        if (!elements.name.value) {
            alert('Por favor ingresa un Nombre del Producto antes de guardar.');
            return;
        }

        const history = JSON.parse(localStorage.getItem('prismar_history')) || [];
        
        const cProduct = parseFloat(elements.costProduct.value) || 0;
        const cSupShip = parseFloat(elements.costSupplierShipping.value) || 0;
        const cAds = parseFloat(elements.costAds.value) || 0;
        const cPack = parseFloat(elements.costPackaging.value) || 0;
        const cOther = parseFloat(elements.costOther.value) || 0;
        const cCusShip = parseFloat(elements.costCustomerShipping.value) || 0;

        const totalCost = cProduct + cSupShip + cAds + cPack + cOther + cCusShip;
        const salePrice = parseFloat(elements.salePrice.value) || 0;
        const profit = salePrice - totalCost;
        const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

        const entry1x = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            name: elements.name.value + ' (1 Unidad)',
            cost: totalCost,
            sale: salePrice,
            profit: profit,
            margin: margin,
            data: {
                name: elements.name.value,
                provider: elements.provider.value,
                cProduct: elements.costProduct.value,
                cSupShip: elements.costSupplierShipping.value,
                cAds: elements.costAds.value,
                cPack: elements.costPackaging.value,
                cOther: elements.costOther.value,
                cCusShip: elements.costCustomerShipping.value,
                salePrice: elements.salePrice.value,
                targetMargin: elements.targetMargin.value,
                offerPrice: elements.offerPrice.value
            }
        };

        const offerPrice = parseFloat(elements.offerPrice.value) || 0;
        const simpleCost2x = (cProduct * 2) + (cSupShip * 2) + cAds + (cPack * 1.2) + cOther + cCusShip;
        const profit2x = offerPrice - simpleCost2x;
        const margin2x = offerPrice > 0 ? (profit2x / offerPrice) * 100 : 0;

        const entry2x = {
            id: Date.now() + 1,
            date: new Date().toLocaleDateString(),
            name: elements.name.value + ' (2 Unidades)',
            cost: simpleCost2x,
            sale: offerPrice,
            profit: profit2x,
            margin: margin2x,
            data: {
                name: elements.name.value,
                provider: elements.provider.value,
                cProduct: elements.costProduct.value,
                cSupShip: elements.costSupplierShipping.value,
                cAds: elements.costAds.value,
                cPack: elements.costPackaging.value,
                cOther: elements.costOther.value,
                cCusShip: elements.costCustomerShipping.value,
                salePrice: elements.salePrice.value,
                targetMargin: elements.targetMargin.value,
                offerPrice: elements.offerPrice.value
            }
        };

        if (offerPrice > 0) {
            history.unshift(entry2x);
        }
        history.unshift(entry1x);

        if (history.length > 20) history.pop();
        
        localStorage.setItem('prismar_history', JSON.stringify(history));
        renderHistory();
        alert('Cálculo guardado en el historial.');
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('prismar_history')) || [];
        const tbody = document.getElementById('history-body');
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay cálculos guardados.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        history.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.date}</td>
                <td><strong>${item.name}</strong></td>
                <td>${formatMoney(item.cost)}</td>
                <td>${formatMoney(item.sale)}</td>
                <td class="${item.profit > 0 ? 'text-success' : 'text-danger'}">${formatMoney(item.profit)}</td>
                <td>${formatPercent(item.margin)}</td>
                <td>
                    <button class="btn btn-sm btn-outline load-history" data-id="${item.id}">Cargar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.load-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                loadHistoryEntry(id);
            });
        });
    }

    function loadHistoryEntry(id) {
        const history = JSON.parse(localStorage.getItem('prismar_history')) || [];
        const entry = history.find(h => h.id === id);
        if (entry) {
            const d = entry.data;
            elements.name.value = d.name;
            elements.provider.value = d.provider || '';
            elements.costProduct.value = d.cProduct;
            elements.costSupplierShipping.value = d.cSupShip;
            elements.costAds.value = d.cAds;
            elements.costPackaging.value = d.cPack;
            elements.costOther.value = d.cOther;
            elements.costCustomerShipping.value = d.cCusShip;
            elements.salePrice.value = d.salePrice;
            elements.targetMargin.value = d.targetMargin;
            elements.offerPrice.value = d.offerPrice || '';
            calculate();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    }

    document.getElementById('btn-save').addEventListener('click', saveToHistory);
    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if(confirm('¿Seguro que deseas borrar todo el historial?')) {
            localStorage.removeItem('prismar_history');
            renderHistory();
        }
    });

    // --- Buttons Actions ---
    document.getElementById('btn-clear').addEventListener('click', () => {
        if(confirm('¿Seguro que deseas limpiar todos los campos?')) {
            Object.values(elements).forEach(el => {
                if(el && el.type !== 'checkbox') el.value = (el.id === 'target-margin' ? 40 : (el.id === 'sales-goal' ? 100000 : ''));
            });
            calculate();
        }
    });

    document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btn-export-pdf').addEventListener('click', () => {
        const element = document.getElementById('printable-area');
        const opt = {
            margin:       10,
            filename:     `Rentabilidad_${elements.name.value || 'PRISMAR'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Hide some non-essential things for PDF
        const noPrintElems = document.querySelectorAll('.no-print');
        noPrintElems.forEach(el => el.style.display = 'none');
        
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore
            noPrintElems.forEach(el => el.style.display = '');
        });
    });

    // --- Mobile Calculator Toggle ---
    const mobileCalcBtn = document.getElementById('mobile-calc-btn');
    const sidebarModal = document.getElementById('sidebar-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseModalX = document.getElementById('btn-close-modal-x');

    if (mobileCalcBtn && sidebarModal && btnCloseModal) {
        mobileCalcBtn.addEventListener('click', () => {
            sidebarModal.classList.add('mobile-active');
        });

        const closeFunc = () => {
            sidebarModal.classList.remove('mobile-active');
            window.scrollTo({top: 0, behavior: 'smooth'}); // Al cerrar ir arriba para ver stats
        };

        btnCloseModal.addEventListener('click', closeFunc);
        if (btnCloseModalX) btnCloseModalX.addEventListener('click', closeFunc);
    }

    // --- Initialization ---
    loadDefaults();
    renderHistory();
    calculate();
});
