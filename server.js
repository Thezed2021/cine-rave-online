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
        if (!fs.existsSync(caminhoBanco)) return [];
        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) { return []; }
}

app.get('/', (req, res) => {
    const catalogo = carregarBanco();
    if (!catalogo || catalogo.length === 0) return res.send("Banco vazio.");
    
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

// --- ROTA RESTAURADA: PLAYER COM METADADOS ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // Se faltar dados, volta pra home
    if (!video) return res.redirect('/');

    // Cria o link profundo para o Rave (opcional, para o botão forçar app)
    const raveLink = `rave://${video.replace(/^https?:\/\//, '')}`;

    res.render('player', { 
        video, 
        titulo, 
        capa,
        raveLink 
    });
});

if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;