const Swal = window.Swal || {
    fire: (data) => {
        alert(`${data.title || 'Info'}\n\n${data.text || ''}`);
    },
    mixin: () => ({
        fire: () => console.log('Toast notifikasi (Swal missing)')
    })
};

document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') analyzeUrl();
        });
    }
});

async function analyzeUrl() {
    const urlInput = document.getElementById('urlInput');
    const btn = document.getElementById('analyzeBtn');
    const loader = document.getElementById('loader');
    const resultsArea = document.getElementById('resultsArea');
    if (!urlInput || !btn || !loader || !resultsArea) {
        console.error("Elemen UI kritis tidak ditemukan.");
        return;
    }

    const url = urlInput.value.trim();
    if (!url) {
        Swal.fire({
            icon: 'warning',
            title: 'URL Kosong',
            text: 'Silakan masukkan URL website yang ingin dianalisis (contoh: google.com).',
            confirmButtonColor: '#7F3FBF',
            confirmButtonText: 'Siap, Mengerti'
        });
        return;
    }
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Memindai...`;
    resultsArea.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat analisis.');
        }
        renderResults(data);
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: 'Analisis Selesai'
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Analisis Gagal',
            text: error.message,
            confirmButtonColor: '#7F3FBF',
            footer: '<span class="text-sm text-slate-500">Pastikan URL benar dan server bisa diakses.</span>'
        });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>Analisa</span> <i class="fa-solid fa-magnifying-glass"></i>`;
        }
        if (loader) loader.classList.add('hidden');
    }
}

function renderResults(data) {
    const resultsArea = document.getElementById('resultsArea');
    const targetUrlEl = document.getElementById('targetUrl');
    const headersList = document.getElementById('headersList');
    const recList = document.getElementById('recommendationsList');
    
    if (targetUrlEl) targetUrlEl.innerText = data.target;

    if (headersList) headersList.innerHTML = '';
    if (recList) recList.innerHTML = '';
    if (headersList) {
        data.headers_analyzed.forEach(item => {
            const colorClass = item.present ? 'border-green-500' : 'border-red-400';
            const icon = item.present 
                ? '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0"><i class="fa-solid fa-check"></i></div>'
                : '<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 flex-shrink-0"><i class="fa-solid fa-xmark"></i></div>';

            const html = `
                <div class="bg-white p-4 rounded-xl border-l-4 shadow-sm flex gap-4 ${colorClass} transition hover:shadow-md">
                    ${icon}
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between flex-wrap gap-2">
                            <h4 class="font-bold text-slate-800 text-sm md:text-base">${item.label}</h4>
                            <span class="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">${item.header}</span>
                        </div>
                        ${item.present 
                            ? `<div class="mt-2 text-xs font-mono bg-slate-50 p-2 rounded text-slate-600 break-all border border-slate-100 overflow-x-auto">${item.value}</div>` 
                            : `<p class="text-sm text-red-500 mt-1 flex items-start"><i class="fa-solid fa-triangle-exclamation mr-1.5 mt-0.5 flex-shrink-0"></i> ${item.risk_msg}</p>`
                        }
                    </div>
                </div>
            `;
            headersList.innerHTML += html;
        });
    }
    if (recList) {
        if (data.recommendations.length === 0) {
            recList.innerHTML = `<li class="text-green-600 font-medium flex items-center"><i class="fa-solid fa-check-circle mr-2"></i>Website ini memiliki konfigurasi header yang sangat aman!</li>`;
        } else {
            data.recommendations.forEach(rec => {
                recList.innerHTML += `<li class="flex items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0"><i class="fa-solid fa-arrow-right text-brand-500 mt-1 mr-2 text-xs flex-shrink-0"></i><span class="leading-relaxed">${rec}</span></li>`;
            });
        }
    }

    if (resultsArea) {
        resultsArea.classList.remove('hidden');
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    animateScore(data.score);
}

function animateScore(score) {
    const circle = document.getElementById('scoreCircle');
    const valueText = document.getElementById('scoreValue');
    const badge = document.getElementById('gradeBadge');
    
    if (!circle || !valueText || !badge) return;

    let color = '#ef4444'; // Merah
    let text = 'HIGH RISK';
    let bg = 'bg-red-100 text-red-700';

    if (score >= 80) {
        color = '#10b981'; // Hijau
        text = 'SECURE';
        bg = 'bg-green-100 text-green-700';
    } else if (score >= 50) {
        color = '#f59e0b'; // Kuning
        text = 'IMPROVE';
        bg = 'bg-yellow-100 text-yellow-700';
    }

    circle.style.stroke = color;
    badge.className = `px-3 py-1 rounded-lg text-sm font-bold ${bg}`;
    badge.innerText = text;

    let current = 0;
    const stepTime = Math.abs(Math.floor(1000 / (score + 1)));
    
    const timer = setInterval(() => {
        if (current < score) {
            current++;
            valueText.innerText = current;
        } else {
            valueText.innerText = score;
            clearInterval(timer);
        }
    }, stepTime);

    const offset = 440 - (440 * score / 100);
    setTimeout(() => {
        if (circle) circle.style.strokeDashoffset = offset;
    }, 100);
}