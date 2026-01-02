// --- ROTA MÁGICA PARA FORÇAR MODO GENERIC ---
// O Rave vê ".mp4" no final e ativa o player nativo
app.get('/content/:id/video.mp4', (req, res) => {
    const { url } = req.query;
    
    if (!url) return res.status(404).send("Vídeo não encontrado");

    // Truque: Adiciona cabeçalhos que fingem ser um arquivo de vídeo real
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
    
    // Redireciona para o link real do watchingvs
    res.redirect(url);
});