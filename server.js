const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

function carregarBanco() {
    try {
        const caminhoBanco = path.join(__dirname, 'banco.json');
        if (!fs.existsSync(caminhoBanco)) return null;
        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) { return null; }
}

app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    if (!catalogo) return res.send("Erro: banco.json");
    catalogo.forEach((item, index) => item.originalIndex = index);
    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];
    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque 
    });
});

app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();
    if (!catalogo || !catalogo[id]) return res.redirect('/');
    res.render('pre', { item: catalogo[id] });
});

// --- ROTA ASSISTIR (Modo Metadata + Link Bruto) ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // Gera link rave:// direto para o arquivo mp4
    // Isso tenta abrir o player nativo do Rave
    const linkLimpo = video.replace(/^https?:\/\//, '');
    const raveDirectLink = `rave://${linkLimpo}`;

    res.render('player', { 
        video, 
        titulo,
        capa,
        raveDirectLink 
    });
});

if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;