// --- ROTA 3: PLAYER ---
app.get('/assistir', (req, res) => {
    const { video, titulo, capa } = req.query;
    
    // TRUQUE DO RAVE:
    // O link "rave://" deve apontar para o VÍDEO MP4 (video), e não para o SITE.
    // Isso força o Rave a abrir o player nativo dele direto no arquivo.
    const raveDirectLink = `rave://https://rave.io/content?url=${encodeURIComponent(video)}`;

    res.render('player', { 
        video, 
        titulo,
        capa,
        raveLink: raveDirectLink
    });
});