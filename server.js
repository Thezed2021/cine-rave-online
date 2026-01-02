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

// --- ROTA MÁGICA .MP4 (Para enganar o Rave) ---
app.get('/content/:id/video.mp4', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(404).send("Vídeo não encontrado");

    // Finge ser um arquivo MP4 real
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
    
    res.redirect(url);
});

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

// --- ROTA ASSISTIR (Corrigida para não crashar) ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // Detecta o domínio atual automaticamente (ex: seusite.vercel.app)
    const host = req.headers.host; 
    const protocol = req.secure ? 'https' : 'http'; // Vercel sempre usa https no final
    const baseUrl = `https://${host}`;

    // Cria o Link Mágico aqui no servidor (Mais seguro)
    const magicUrl = `${baseUrl}/content/${Date.now()}/video.mp4?url=${encodeURIComponent(video)}`;
    
    // Link para abrir direto no app (fallback)
    const raveDirectLink = `rave://${host}/content/${Date.now()}/video.mp4?url=${encodeURIComponent(video)}`;

    res.render('player', { 
        video, 
        titulo,
        capa,
        magicUrl,      // Passa a URL pronta para o EJS
        raveDirectLink 
    });
});

if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
}
module.exports = app;