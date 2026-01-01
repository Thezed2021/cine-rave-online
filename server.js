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

// --- FUNÇÃO DE CARREGAMENTO CORRIGIDA ---
function carregarBanco() {
    try {
        // CORREÇÃO: Usa __dirname para garantir que ache o arquivo na Vercel
        const caminhoBanco = path.join(__dirname, 'banco.json');
        
        // Verifica se o arquivo existe antes de ler
        if (!fs.existsSync(caminhoBanco)) {
            console.error("ERRO CRÍTICO: banco.json não encontrado no caminho:", caminhoBanco);
            return null; // Retorna nulo para avisar erro
        }

        const data = fs.readFileSync(caminhoBanco, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler banco:", err);
        return null;
    }
}

// --- ROTA 1: HOME ---
app.get('/', (req, res) => {
    const catalogo = carregarBanco();

    // SE O BANCO NÃO CARREGAR, MOSTRA O ERRO NA TELA PARA VOCÊ LER
    if (!catalogo) {
        return res.send(`
            <h1 style="color:red; font-family:sans-serif;">ERRO: O site não encontrou o banco.json</h1>
            <p>Verifique se o arquivo <b>banco.json</b> está no seu GitHub.</p>
            <p>Caminho tentado: ${path.join(__dirname, 'banco.json')}</p>
        `);
    }

    const filmes = catalogo.filter(i => i.tipo === 'filme');
    const series = catalogo.filter(i => i.tipo === 'serie');
    const destaques = catalogo.filter(i => i.destaque);
    const destaque = destaques.length > 0 ? destaques[Math.floor(Math.random() * destaques.length)] : catalogo[0];

    // Adiciona índice para links
    catalogo.forEach((item, index) => item.originalIndex = index);

    res.render('index', { 
        filmes: catalogo.filter(i => i.tipo === 'filme'), 
        series: catalogo.filter(i => i.tipo === 'serie'), 
        destaque 
    });
});

// --- ROTA 2: DETALHES ---
app.get('/detalhes', (req, res) => {
    const { id } = req.query;
    const catalogo = carregarBanco();

    if (!catalogo || !catalogo[id]) return res.redirect('/');
    
    const item = catalogo[id];

    res.render('pre', { 
        item, 
        ogTitle: item.titulo,
        ogImage: item.capa,
        ogVideo: item.link
    });
});

// --- ROTA 3: PLAYER ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    res.render('player', { 
        video, 
        titulo,
        capa,
        raveLink: `rave://https://rave.io/content?url=${encodeURIComponent(video)}`
    });
});

// Exporta para Vercel
if (require.main === module) {
    app.listen(PORT, () => { console.log(`Rodando localmente na porta ${PORT}`); });
}
module.exports = app;