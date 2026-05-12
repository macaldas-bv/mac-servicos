const KEYS = { CLIENTES: 'mac_clientes', ORDENS: 'mac_ordens', SETTINGS: 'mac_settings' };

let clientes = JSON.parse(localStorage.getItem(KEYS.CLIENTES)) || [];
let ordens = JSON.parse(localStorage.getItem(KEYS.ORDENS)) || [];
let config = JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || { name: 'Miranda', phone: '', hourRate: 100 };

const refreshIcons = () => { if (window.lucide) lucide.createIcons(); };

const showToast = (msg, icon = 'check') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    refreshIcons();
    setTimeout(() => toast.remove(), 3000);
};

// --- DATA PERSISTENCE ---
const saveToLocal = () => {
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify(clientes));
    localStorage.setItem(KEYS.ORDENS, JSON.stringify(ordens));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(config));
};

// --- SHARED UI FUNCTIONS ---
window.sendWA = (id) => {
    const o = ordens.find(x => x.id === id);
    if (!o) return;
    
    let message = `*RELATÓRIO DE SERVIÇO*\n`;
    message += `📅 Data: ${o.date.split('-').reverse().join('/')}\n`;
    message += `👤 Cliente: ${o.clientName}\n\n`;
    message += `*Serviço:*\n${o.desc}\n\n`;
    
    if (o.type === 'hora' && o.hours && o.rate) {
        message += `⏱️ ${o.hours}h x R$ ${o.rate.toFixed(2)}/h = R$ ${o.serviceVal.toFixed(2)}\n`;
    } else if (o.serviceVal) {
        message += `💰 Valor Mão de Obra: R$ ${o.serviceVal.toFixed(2)}\n`;
    }

    if (o.matCost) {
        message += `📦 Materiais: R$ ${o.matCost.toFixed(2)}\n`;
        if (o.mat) message += `📝 Itens: ${o.mat}\n`;
    }
    
    message += `\n*TOTAL:* R$ ${parseFloat(o.total).toFixed(2)}\n\n`;
    
    if (config.pix) {
        message += `*PAGAMENTO PIX:*\n🔑 Chave: ${config.pix}\n\n`;
    }
    
    message += `_${config.name}_`;
    
    window.open(`https://wa.me/55${o.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
};

window.sendReceipt = (id) => {
    const o = ordens.find(x => x.id === id);
    if (!o) return;
    
    let message = `*RECIBO DE PAGAMENTO*\n`;
    message += `----------------------------\n`;
    message += `Recebi de: *${o.clientName}*\n`;
    message += `A quantia de: *R$ ${parseFloat(o.total).toFixed(2)}*\n`;
    message += `Referente a: ${o.desc}\n`;
    message += `----------------------------\n`;
    message += `📅 Data: ${o.date.split('-').reverse().join('/')}\n\n`;
    
    message += `_MAC SERVIÇO E MANUTENÇÃO_`;
    
    window.open(`https://wa.me/55${o.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
};

window.generateReceiptImage = (data) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1000;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    const logo = new Image();
    logo.src = 'assets/logo.png';
    
    logo.onload = () => {
        // Draw Logo
        const logoWidth = 300;
        const logoHeight = (logo.height * logoWidth) / logo.width;
        ctx.drawImage(logo, (canvas.width - logoWidth) / 2, 80, logoWidth, logoHeight);

        // Header
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RECIBO DE PAGAMENTO', canvas.width / 2, 450);

        // Separator
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 480);
        ctx.lineTo(700, 480);
        ctx.stroke();

        // Content
        ctx.textAlign = 'left';
        ctx.font = '32px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        
        ctx.fillText('Recebi de:', 100, 550);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillText(data.clientName, 100, 600);

        ctx.fillStyle = '#64748b';
        ctx.font = '32px Inter, sans-serif';
        ctx.fillText('A quantia de:', 100, 680);
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillText(`R$ ${data.total}`, 100, 740);

        ctx.fillStyle = '#64748b';
        ctx.font = '32px Inter, sans-serif';
        ctx.fillText('Referente a:', 100, 820);
        ctx.fillStyle = '#0f172a';
        ctx.font = '32px Inter, sans-serif';
        
        // Wrap text for description
        const desc = data.desc || '';
        const words = desc.split(' ');
        let line = '';
        let y = 860;
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > 600 && n > 0) {
                ctx.fillText(line, 100, y);
                line = words[n] + ' ';
                y += 40;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 100, y);

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillText(`Data: ${data.date}`, canvas.width / 2, 930);
        
        ctx.fillStyle = '#0f172a';
        ctx.font = 'italic bold 32px Inter, sans-serif';
        ctx.fillText('MAC SERVIÇO E MANUTENÇÃO', canvas.width / 2, 970);

        // Download
        const link = document.createElement('a');
        link.download = `recibo_${data.clientName.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        showToast('Recibo gerado e baixado!');
    };

    logo.onerror = () => {
        alert('Erro ao carregar o logo em assets/logo.png. Certifique-se de salvar a imagem com este nome na pasta assets.');
    };
};

window.copyOS = (id) => {
    const o = ordens.find(x => x.id === id);
    if (!o) return;
    const text = `Relatório: ${o.clientName} - R$ ${o.total}`;
    navigator.clipboard.writeText(text).then(() => showToast('Copiado!'));
};

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
    
    // Initialize specific page logic
    const path = window.location.pathname;
    if (path.includes('os-do-dia.html')) initTodayOS();
    if (path.includes('agendamento.html')) initAgendamento();
    if (path.includes('clientes.html')) initCustomers();
    if (path.includes('nova-os.html')) initOS();
    if (path.includes('historico.html')) initHistory();
    if (path.includes('configuracoes.html')) initSettings();
    if (path.endsWith('/') || path.includes('index.html')) initDashboard();
});

// --- DASHBOARD (index.html) ---
function initDashboard() {
    const dashClientes = document.getElementById('dash-clientes');
    if (dashClientes) dashClientes.innerText = clientes.length;
    
    const dashServicos = document.getElementById('dash-servicos');
    if (dashServicos) {
        const now = new Date();
        const mesOrdens = ordens.filter(o => new Date(o.date).getMonth() === now.getMonth());
        dashServicos.innerText = mesOrdens.length;
        
        const dashReceita = document.getElementById('dash-receita');
        if (dashReceita) {
            const receita = mesOrdens.reduce((s, o) => s + parseFloat(o.total), 0);
            dashReceita.innerText = `R$ ${receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
    }

    const list = document.getElementById('dash-recent');
    if (list) {
        list.innerHTML = '';
        ordens.slice(-3).reverse().forEach(o => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.style.padding = '1rem';
            card.innerHTML = `<strong>${o.clientName}</strong><br><small>${o.date.split('-').reverse().join('/')} - R$ ${parseFloat(o.total).toFixed(2)}</small>`;
            list.appendChild(card);
        });
    }
}

// --- CLIENTES ---
function initCustomers() {
    const form = document.getElementById('customer-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('cust-id').value;
            const data = { 
                id: id || Date.now().toString(), 
                name: document.getElementById('cust-name').value, 
                phone: document.getElementById('cust-phone').value, 
                city: document.getElementById('cust-city').value,
                address: document.getElementById('cust-address').value
            };
            if (id) { const idx = clientes.findIndex(c => c.id === id); clientes[idx] = data; }
            else { clientes.push(data); }
            saveToLocal();
            e.target.reset(); document.getElementById('cust-id').value = '';
            showToast('Cliente salvo!'); renderCustomers();
        };
    }
    renderCustomers();
}

function renderCustomers() {
    const list = document.getElementById('customer-list');
    if (!list) return;
    list.innerHTML = '';
    clientes.forEach(c => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="card-header"><strong>${c.name}</strong><small>${c.phone}</small></div>
            <div class="card-footer">
                <button class="btn btn-secondary btn-sm" onclick="editCust('${c.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="delCust('${c.id}')">Excluir</button>
            </div>`;
        list.appendChild(div);
    });
}

window.editCust = (id) => {
    const c = clientes.find(x => x.id === id);
    if (!c) return;
    document.getElementById('cust-id').value = c.id;
    document.getElementById('cust-name').value = c.name;
    document.getElementById('cust-phone').value = c.phone;
    document.getElementById('cust-city').value = c.city;
    document.getElementById('cust-address').value = c.address || '';
    window.scrollTo(0, 0);
};

window.delCust = (id) => {
    if (confirm('Excluir cliente?')) {
        clientes = clientes.filter(x => x.id !== id);
        saveToLocal();
        showToast('Cliente excluído', 'trash'); renderCustomers();
    }
};

// --- OS ---
function initOS() {
    const sel = document.getElementById('os-client');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione o cliente...</option>';
    clientes.forEach(c => sel.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    
    const dateInput = document.getElementById('os-date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    const hourRateInput = document.getElementById('os-val-hour');
    if (hourRateInput) hourRateInput.value = config.hourRate;

    // Check for Edit Mode
    const editId = sessionStorage.getItem('mac_edit_os');
    if (editId) {
        const o = ordens.find(x => x.id === editId);
        if (o) {
            document.getElementById('os-id').value = o.id;
            const client = clientes.find(c => c.phone === o.clientPhone);
            if (client) document.getElementById('os-client').value = client.id;
            document.getElementById('os-date').value = o.date;
            document.getElementById('os-desc').value = o.desc;
            document.getElementById('os-type').value = o.type;
            document.getElementById('os-mat').value = o.mat || '';
            document.getElementById('os-val-mat').value = o.matCost || '';
            
            if (o.type === 'fixo') {
                // If we store total as (service + mat), we might need to subtract matCost 
                // to show original service value, or just show total.
                // Let's assume user enters service value and mat value separately now.
                // For old OS, matCost is null.
                document.getElementById('os-val-fixo').value = o.serviceVal || o.total;
            } else {
                document.getElementById('os-hours').value = o.hours || '';
                document.getElementById('os-val-hour').value = o.rate || config.hourRate;
                document.getElementById('group-fixo').style.display = 'none';
                document.getElementById('group-hora').style.display = 'block';
                document.getElementById('group-hora-2').style.display = 'block';
            }
            document.querySelector('button[type="submit"]').innerHTML = '<i data-lucide="save"></i> ATUALIZAR OS';
        }
        sessionStorage.removeItem('mac_edit_os');
    }

    const osType = document.getElementById('os-type');
    if (osType) {
        osType.onchange = (e) => {
            const isHora = e.target.value === 'hora';
            document.getElementById('group-fixo').style.display = isHora ? 'none' : 'block';
            document.getElementById('group-hora').style.display = 'block'; // Always keep rate visible if hourly
            document.getElementById('group-hora-2').style.display = isHora ? 'block' : 'none';
        };
    }

    const form = document.getElementById('os-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('os-id').value;
            const type = document.getElementById('os-type').value;
            const cliente = clientes.find(c => c.id === document.getElementById('os-client').value);
            if (!cliente) { alert('Selecione um cliente!'); return; }
            
            let serviceVal = 0;
            if (type === 'fixo') serviceVal = parseFloat(document.getElementById('os-val-fixo').value || 0);
            else serviceVal = parseFloat(document.getElementById('os-hours').value || 0) * parseFloat(document.getElementById('os-val-hour').value || 0);

            const matCost = parseFloat(document.getElementById('os-val-mat').value || 0);
            const total = serviceVal + matCost;

            const osData = {
                id: id || Date.now().toString(), 
                clientName: cliente.name, 
                clientPhone: cliente.phone,
                date: document.getElementById('os-date').value, 
                desc: document.getElementById('os-desc').value,
                serviceVal: serviceVal,
                matCost: matCost,
                total: total, 
                type: type, 
                hours: type === 'hora' ? parseFloat(document.getElementById('os-hours').value || 0) : null,
                rate: type === 'hora' ? parseFloat(document.getElementById('os-val-hour').value || 0) : null,
                mat: document.getElementById('os-mat').value
            };

            if (id) {
                const idx = ordens.findIndex(x => x.id === id);
                if (idx !== -1) ordens[idx] = osData;
            } else {
                ordens.push(osData);
            }

            saveToLocal();
            showToast(id ? 'OS atualizada!' : 'Ordem de serviço salva!');
            setTimeout(() => window.location.href = 'historico.html', 1000);
        };
    }
}

// --- RELATÓRIOS (HISTÓRICO) ---
function initHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;

    const filterClient = document.getElementById('filter-client');
    const filterMonth = document.getElementById('filter-month');
    const btnFilter = document.getElementById('btn-filter');
    const btnSendReport = document.getElementById('btn-send-report');
    const btnSendReceipt = document.getElementById('btn-send-receipt');
    const summaryCard = document.getElementById('report-summary');
    const reportTotal = document.getElementById('report-total');
    const reportCount = document.getElementById('report-count');

    // Populate client filter
    if (filterClient) {
        filterClient.innerHTML = '<option value="">Todos os Clientes</option>';
        clientes.forEach(c => filterClient.innerHTML += `<option value="${c.phone}">${c.name}</option>`);
    }

    // Set default month to current
    if (filterMonth && !filterMonth.value) {
        const now = new Date();
        filterMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    let currentFiltered = [];

    const renderFiltered = () => {
        const clientVal = filterClient ? filterClient.value : '';
        const monthVal = filterMonth ? filterMonth.value : '';

        currentFiltered = ordens.slice().reverse();

        if (clientVal) {
            currentFiltered = currentFiltered.filter(o => o.clientPhone === clientVal);
        }

        if (monthVal) {
            currentFiltered = currentFiltered.filter(o => o.date.startsWith(monthVal));
        }

        list.innerHTML = '';
        let totalVal = 0;

        if (currentFiltered.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-secondary)">Nenhum registro encontrado para este filtro.</div>';
            if (summaryCard) summaryCard.style.display = 'none';
        } else {
            currentFiltered.forEach(o => {
                totalVal += parseFloat(o.total);
                const cliente = clientes.find(c => c.phone === o.clientPhone) || {};
                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `
                    <div class="card-header">
                        <div>
                            <strong>${o.clientName}</strong><br>
                            <small style="color:var(--primary-color)">${cliente.city || ''}${cliente.address ? ' - ' + cliente.address : ''}</small>
                        </div>
                        <small>${o.date.split('-').reverse().join('/')}</small>
                    </div>
                    <p style="font-size:0.9rem;color:var(--text-secondary); margin-bottom: 0.5rem;">${o.desc}</p>
                    <div style="font-size:0.8rem; color:var(--text-secondary)">📞 ${o.clientPhone}</div>
                    <div style="margin-top:0.75rem;font-weight:800;color:var(--primary-color); font-size: 1.1rem;">R$ ${parseFloat(o.total).toFixed(2)}</div>
                    <div class="card-footer">
                        <button class="btn btn-whatsapp btn-sm" onclick="sendReceipt('${o.id}')"><i data-lucide="send"></i> Zap</button>
                        <button class="btn btn-primary btn-sm" onclick="generateReceiptImage({
                            clientName: '${o.clientName}',
                            total: '${parseFloat(o.total).toFixed(2)}',
                            desc: '${o.desc.replace(/'/g, "\\'")}',
                            date: '${o.date.split('-').reverse().join('/')}'
                        })"><i data-lucide="image"></i> JPG</button>
                        <button class="btn btn-secondary btn-sm" onclick="editOS('${o.id}')"><i data-lucide="edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="delOS('${o.id}')"><i data-lucide="trash"></i></button>
                    </div>`;
                list.appendChild(card);
            });

            // Update Summary
            if (summaryCard) {
                summaryCard.style.display = 'block';
                reportTotal.innerText = `R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                reportCount.innerText = `${currentFiltered.length} serviço(s) no período`;
            }
        }
        refreshIcons();
    };

    if (btnFilter) btnFilter.onclick = renderFiltered;
    
    if (btnSendReport) {
        btnSendReport.onclick = () => {
            if (currentFiltered.length === 0) return;
            
            const clientPhone = currentFiltered[0].clientPhone;
            const clientName = currentFiltered[0].clientName;
            let total = 0;
            
            let message = `*RELATÓRIO DE SERVIÇOS*\n`;
            message += `👤 *Cliente:* ${clientName}\n`;
            message += `📅 *Período:* ${filterMonth.value.split('-').reverse().join('/')}\n`;
            message += `----------------------------\n\n`;
            
            currentFiltered.slice().reverse().forEach(o => {
                const date = o.date.split('-').reverse().join('/');
                message += `📅 ${date}\n🛠️ ${o.desc}\n`;
                
                if (o.type === 'hora' && o.hours && o.rate) {
                    message += `⏱️ ${o.hours}h x R$ ${o.rate.toFixed(2)}/h = R$ ${o.serviceVal.toFixed(2)}\n`;
                } else if (o.serviceVal) {
                    message += `💰 Serviço: R$ ${o.serviceVal.toFixed(2)}\n`;
                }

                if (o.matCost) {
                    message += `📦 Materiais: R$ ${o.matCost.toFixed(2)}\n`;
                    if (o.mat) message += `📝 Itens: ${o.mat}\n`;
                }
                
                message += `✅ *Subtotal:* R$ ${parseFloat(o.total).toFixed(2)}\n\n`;
                total += parseFloat(o.total);
            });
            
            message += `----------------------------\n`;
            message += `*TOTAL:* R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
            
            if (config.pix) {
                message += `*PAGAMENTO PIX:*\n🔑 Chave: ${config.pix}\n\n`;
            }
            
            message += `_${config.name}_`;
            
            window.open(`https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        };
    }

    if (btnSendReceipt) {
        btnSendReceipt.onclick = () => {
            if (currentFiltered.length === 0) return;
            
            const totalVal = currentFiltered.reduce((s, o) => s + parseFloat(o.total), 0);
            const period = filterMonth.value ? filterMonth.value.split('-').reverse().join('/') : '';
            
            generateReceiptImage({
                clientName: currentFiltered[0].clientName,
                total: totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                desc: `Serviços realizados no período de ${period}`,
                date: new Date().toLocaleDateString('pt-BR')
            });
        };
    }
    
    renderFiltered();
}

// --- OS DO DIA ---
function initTodayOS() {
    const list = document.getElementById('today-os-list');
    if (!list) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = ordens.filter(o => o.date === today);
    
    list.innerHTML = '';
    
    if (todayOrders.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-secondary)">Não há serviços agendados para hoje.</div>';
        return;
    }

    todayOrders.reverse().forEach(o => {
        const cliente = clientes.find(c => c.phone === o.clientPhone) || {};
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <strong>${o.clientName}</strong><br>
                    <small style="color:var(--primary-color)">${cliente.city || ''}${cliente.address ? ' - ' + cliente.address : ''}</small>
                </div>
                <small>${o.date.split('-').reverse().join('/')}</small>
            </div>
            <p style="font-size:0.9rem;color:var(--text-secondary); margin-bottom: 0.5rem;">${o.desc}</p>
            <div style="font-size:0.8rem; color:var(--text-secondary)">📞 ${o.clientPhone}</div>
            <div style="margin-top:0.75rem;font-weight:800;color:var(--primary-color); font-size: 1.1rem;">R$ ${parseFloat(o.total).toFixed(2)}</div>
            <div class="card-footer">
                <button class="btn btn-whatsapp btn-sm" onclick="sendWA('${o.id}')"><i data-lucide="send"></i> Zap</button>
                <button class="btn btn-secondary btn-sm" onclick="editOS('${o.id}')"><i data-lucide="edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delOS('${o.id}')"><i data-lucide="trash"></i></button>
            </div>`;
        list.appendChild(card);
    });
    refreshIcons();
}

// --- AGENDAMENTO (FUTUROS) ---
function initAgendamento() {
    const list = document.getElementById('agendamento-list');
    if (!list) return;
    
    const today = new Date().toISOString().split('T')[0];
    const futureOrders = ordens.filter(o => o.date > today);
    
    list.innerHTML = '';
    
    if (futureOrders.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-secondary)">Não há serviços agendados para os próximos dias.</div>';
        return;
    }

    // Sort by date ascending for upcoming view
    futureOrders.sort((a,b) => a.date.localeCompare(b.date));

    futureOrders.forEach(o => {
        const cliente = clientes.find(c => c.phone === o.clientPhone) || {};
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <strong>${o.clientName}</strong><br>
                    <small style="color:var(--primary-color)">${cliente.city || ''}${cliente.address ? ' - ' + cliente.address : ''}</small>
                </div>
                <small>${o.date.split('-').reverse().join('/')}</small>
            </div>
            <p style="font-size:0.9rem;color:var(--text-secondary); margin-bottom: 0.5rem;">${o.desc}</p>
            <div style="font-size:0.8rem; color:var(--text-secondary)">📞 ${o.clientPhone}</div>
            <div style="margin-top:0.75rem;font-weight:800;color:var(--primary-color); font-size: 1.1rem;">R$ ${parseFloat(o.total).toFixed(2)}</div>
            <div class="card-footer">
                <button class="btn btn-secondary btn-sm" onclick="editOS('${o.id}')"><i data-lucide="edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delOS('${o.id}')"><i data-lucide="trash"></i></button>
            </div>`;
        list.appendChild(card);
    });
    refreshIcons();
}

window.editOS = (id) => {
    sessionStorage.setItem('mac_edit_os', id);
    window.location.href = 'nova-os.html';
};

window.delOS = (id) => {
    if (confirm('Deseja excluir esta ordem de serviço?')) {
        ordens = ordens.filter(x => x.id !== id);
        saveToLocal();
        showToast('OS excluída!', 'trash');
        if (window.location.pathname.includes('historico.html')) initHistory();
        if (window.location.pathname.includes('os-do-dia.html')) initTodayOS();
    }
};

// --- SETTINGS ---
function initSettings() {
    const setName = document.getElementById('set-name');
    if (setName) {
        setName.value = config.name;
        document.getElementById('set-phone').value = config.phone;
        document.getElementById('set-pix').value = config.pix || '';
        document.getElementById('set-hour-rate').value = config.hourRate;
    }

    const form = document.getElementById('settings-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            config = { 
                name: document.getElementById('set-name').value, 
                phone: document.getElementById('set-phone').value, 
                pix: document.getElementById('set-pix').value,
                hourRate: document.getElementById('set-hour-rate').value 
            };
            saveToLocal();
            showToast('Configurações salvas!');
        };
    }
}

// --- BACKUP ---
window.exportData = () => {
    const data = { clientes, ordens, config };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup_mac_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); showToast('Backup exportado!');
};

window.importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (res) => {
        try {
            const data = JSON.parse(res.target.result);
            if (data.clientes && data.ordens) {
                clientes = data.clientes; ordens = data.ordens; config = data.config || config;
                saveToLocal();
                showToast('Dados importados!');
                setTimeout(() => location.reload(), 1000);
            }
        } catch (err) { alert('Arquivo de backup inválido!'); }
    };
    reader.readAsText(file);
};
