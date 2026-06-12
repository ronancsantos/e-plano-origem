const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const authRoutes = require("./routes/auth");
const supabase = require("./supabase");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://eplano.semedcarutapera.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // permite requests sem origin (mobile, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Bloqueado pelo CORS"));
  },
  credentials: true
}));

app.use(express.json({ limit: "8mb" }));
app.use("/auth", authRoutes);

const parsePeriodo = (p) => {
  try {
    const parsed = JSON.parse(p);
    if (Array.isArray(parsed)) return parsed[0];
    return parsed;
  } catch {
    return p;
  }
};

const parseJSON = (value) => {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
};

const supabaseError = (res, error, defaultMessage) => {
  console.error(error);
  return res.status(500).json({ error: defaultMessage || (error && error.message) || "Erro no banco de dados." });
};

const limparAtuacoesProfessor = async (professorId) => {
  const { error } = await supabase
    .from("professor_atuacoes")
    .delete()
    .eq("professor_id", professorId);

  return error;
};

const inserirAtuacoesProfessor = async (professorId, atribuicoes) => {
  const lista = Array.isArray(atribuicoes) ? atribuicoes : [];
  if (lista.length === 0) return null;

  const registros = lista.map((item) => ({
    professor_id: Number(professorId),
    escola_id: Number(item.escolaId),
    componente_id: Number(item.componenteId),
    turma_id: Number(item.turmaId)
  }));

  const { error } = await supabase.from("professor_atuacoes").insert(registros);
  return error;
};

const extensaoPorMime = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const normalizarImagemBase64 = (imagemBase64, contentType) => {
  const valor = String(imagemBase64 || "");
  const dataUrlMatch = valor.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);

  if (dataUrlMatch) {
    return {
      contentType: dataUrlMatch[1],
      base64: dataUrlMatch[2]
    };
  }

  return {
    contentType,
    base64: valor
  };
};

const normalizarTexto = (valor) =>
  String(valor || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizarAno = (valor) =>
  String(valor || "")
    .replace(/º/g, "")
    .replace(/ª/g, "")
    .replace(/\s+/g, "")
    .trim();

const statusEhConcluido = (valor) => {
  const s = String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return ["concluido", "finalizado", "enviado"].includes(s);
};

const statusEhAndamento = (valor) => {
  const s = String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return ["em_andamento", "em andamento", "andamento", "rascunho"].includes(s);
};

const statusEhPendente = (valor) => {
  const s = String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return ["pendente", "nao iniciado", "nao_iniciado", ""].includes(s);
};

const parsePlano = (plano) => ({
  ...plano,
  periodo: parsePeriodo(plano.periodo),
  habilidades: parseJSON(plano.habilidades),
  objetos: parseJSON(plano.objetos),
  metodologias: parseJSON(plano.metodologias),
  metodologias_recursos: parseJSON(plano.metodologias_recursos),
  instrumentos: parseJSON(plano.instrumentos),
  instrumentos_recursos: parseJSON(plano.instrumentos_recursos),
  tipos_avaliacao: parseJSON(plano.tipos_avaliacao),
  generos: parseJSON(plano.generos)
});

app.post("/planos", async (req, res) => {
  try {
    const {
      componente,
      ano,
      periodo,
      habilidades,
      objetos,
      metodologias,
      instrumentos,
      tipos_avaliacao,
      status
    } = req.body;

    const { data, error } = await supabase
      .from("planos")
      .insert([
        {
          componente: componente || "",
          ano: ano || "",
          periodo: periodo || "",
          habilidades: JSON.stringify(habilidades || []),
          objetos: JSON.stringify(objetos || []),
          metodologias: JSON.stringify(metodologias || []),
          instrumentos: JSON.stringify(instrumentos || []),
          tipos_avaliacao: JSON.stringify(tipos_avaliacao || []),
          status: status || "rascunho"
        }
      ])
      .select("id")
      .single();

    if (error) return supabaseError(res, error);
    return res.json({ id: data.id });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/planos", async (req, res) => {
  try {
    const { data, error } = await supabase.from("planos").select("*").order("id", { ascending: false });
    if (error) return supabaseError(res, error);
    return res.json((data || []).map(parsePlano));
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/planos/filtro", async (req, res) => {
  try {
    const { componente, ano, periodo } = req.query;
    let query = supabase.from("planos").select("*");
    if (componente) query = query.eq("componente", componente);
    if (ano) query = query.eq("ano", ano);
    if (periodo) query = query.eq("periodo", periodo);
    const { data, error } = await query.order("id", { ascending: false });
    if (error) return supabaseError(res, error);
    return res.json((data || []).map(parsePlano));
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/planos/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("planos")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) return supabaseError(res, error);
    if (!data) return res.status(404).json({ error: "Plano não encontrado" });
    return res.json(parsePlano(data));
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.put("/planos/:id", async (req, res) => {
  try {
    const {
      professor_id,
      componente,
      ano,
      periodo,
      campo_atuacao,
      genero,
      habilidades,
      objetos,
      metodologias,
      metodologias_recursos,
      instrumentos,
      instrumentos_recursos,
      tipos_avaliacao,
      status,
      progresso
    } = req.body;

    const { error } = await supabase
      .from("planos")
      .update({
        professor_id: professor_id || null,
        componente: componente || "",
        ano: ano || "",
        periodo: periodo || "",
        campo_atuacao: campo_atuacao || "",
        genero: genero || "",
        habilidades: JSON.stringify(habilidades || []),
        objetos: JSON.stringify(objetos || []),
        metodologias: JSON.stringify(metodologias || []),
        metodologias_recursos: JSON.stringify(metodologias_recursos || []),
        instrumentos: JSON.stringify(instrumentos || []),
        instrumentos_recursos: JSON.stringify(instrumentos_recursos || []),
        tipos_avaliacao: JSON.stringify(tipos_avaliacao || []),
        status: status || "rascunho",
        progresso: progresso || 0
      })
      .eq("id", req.params.id);

    if (error) return supabaseError(res, error);
    return res.json({ ok: true });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.delete("/planos/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("planos").delete().eq("id", req.params.id);
    if (error) return supabaseError(res, error);
    return res.json({ ok: true });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/bncc/:componente/:ano", (req, res) => {
  try {
    const { componente, ano } = req.params;
    const dados = require("./bncc.json");
    const disciplina = dados[componente];
    if (!disciplina) return res.json({});
    const anoEncontrado = disciplina.ano.find((a) => a.nome_ano.includes(`${ano}º`));
    if (!anoEncontrado) return res.json({});
    const resultado = {};
    anoEncontrado.unidades_tematicas.forEach((unidade) => {
      const nomeUnidade = unidade.nome_unidade;
      if (!resultado[nomeUnidade]) resultado[nomeUnidade] = {};
      unidade.objeto_conhecimento.forEach((obj) => {
        const nomeObjeto = obj.nome_objeto;
        if (!resultado[nomeUnidade][nomeObjeto]) resultado[nomeUnidade][nomeObjeto] = [];
        obj.habilidades.forEach((h) => {
          const match = h.nome_habilidade.match(/\((.*?)\)\s*(.*)/);
          const habilidade = {
            codigo: match ? match[1] : h.nome_habilidade,
            descricao: match ? match[2] : h.nome_habilidade
          };
          const jaExiste = resultado[nomeUnidade][nomeObjeto].some((item) => item.codigo === habilidade.codigo);
          if (!jaExiste) resultado[nomeUnidade][nomeObjeto].push(habilidade);
        });
      });
    });
    res.json(resultado);
  } catch (erro) {
    console.error("Erro BNCC:", erro);
    res.status(500).json({ error: "Erro ao carregar BNCC" });
  }
});

app.get("/escolas", async (req, res) => {
  try {
    const { data, error } = await supabase.from("escolas").select("id,nome").order("nome", { ascending: true });
    if (error) return supabaseError(res, error);
    res.json(data || []);
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/componentes", async (req, res) => {
  try {
    const { data, error } = await supabase.from("componentes").select("id,nome").order("nome", { ascending: true });
    if (error) return supabaseError(res, error);
    res.json(data || []);
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/turmas", async (req, res) => {
  try {
    const { data, error } = await supabase.from("turmas").select("id,ano,turma").order("ano", { ascending: true }).order("turma", { ascending: true });
    if (error) return supabaseError(res, error);
    res.json((data || []).map((turma) => ({ ...turma, nome: `${turma.ano} - Turma ${turma.turma}` })));
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/professores", async (req, res) => {
  try {
    const [{ data: professores, error: errProf }, { data: atuacoes, error: errAtuacoes }, { data: escolas, error: errEscolas }, { data: componentes, error: errComponentes }, { data: turmas, error: errTurmas }] = await Promise.all([
      supabase.from("professores").select("*").order("nome", { ascending: true }),
      supabase.from("professor_atuacoes").select("*"),
      supabase.from("escolas").select("id,nome"),
      supabase.from("componentes").select("id,nome"),
      supabase.from("turmas").select("id,ano,turma")
    ]);

    if (errProf || errAtuacoes || errEscolas || errComponentes || errTurmas) {
      return supabaseError(res, errProf || errAtuacoes || errEscolas || errComponentes || errTurmas);
    }

    const escolasMap = new Map((escolas || []).map((item) => [item.id, item.nome]));
    const componentesMap = new Map((componentes || []).map((item) => [item.id, item.nome]));
    const turmasMap = new Map((turmas || []).map((item) => [item.id, `${item.ano} - Turma ${item.turma}`]));

    const mapa = new Map();
    (professores || []).forEach((professor) => {
      mapa.set(professor.id, {
        id: professor.id,
        nome: professor.nome,
        turno: professor.turno,
        email: professor.email,
        senha: professor.senha,
        atribuicoes: []
      });
    });

    (atuacoes || []).forEach((atuacao) => {
      const professor = mapa.get(atuacao.professor_id);
      if (!professor) return;
      professor.atribuicoes.push({
        id: atuacao.id,
        escola_id: atuacao.escola_id,
        escola_nome: escolasMap.get(atuacao.escola_id) || "",
        componente_id: atuacao.componente_id,
        componente_nome: componentesMap.get(atuacao.componente_id) || "",
        turma_id: atuacao.turma_id,
        turma_nome: turmasMap.get(atuacao.turma_id) || ""
      });
    });

    res.json(Array.from(mapa.values()));
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/professores/:id", async (req, res) => {
  try {
    const professorId = req.params.id;
    const [{ data: professor, error: errProf }, { data: atuacoes, error: errAtuacoes }, { data: escolas, error: errEscolas }, { data: componentes, error: errComponentes }, { data: turmas, error: errTurmas }] = await Promise.all([
      supabase.from("professores").select("*").eq("id", professorId).maybeSingle(),
      supabase.from("professor_atuacoes").select("*").eq("professor_id", professorId),
      supabase.from("escolas").select("id,nome"),
      supabase.from("componentes").select("id,nome"),
      supabase.from("turmas").select("id,ano,turma")
    ]);

    if (errProf || errAtuacoes || errEscolas || errComponentes || errTurmas) {
      return supabaseError(res, errProf || errAtuacoes || errEscolas || errComponentes || errTurmas);
    }

    if (!professor) return res.status(404).json({ error: "Professor não encontrado" });

    const escolasMap = new Map((escolas || []).map((item) => [item.id, item.nome]));
    const componentesMap = new Map((componentes || []).map((item) => [item.id, item.nome]));
    const turmasMap = new Map((turmas || []).map((item) => [item.id, `${item.ano} - Turma ${item.turma}`]));

    res.json({
      id: professor.id,
      nome: professor.nome,
      turno: professor.turno,
      email: professor.email,
      senha: professor.senha,
      atribuicoes: (atuacoes || []).map((atuacao) => ({
        id: atuacao.id,
        escola_id: atuacao.escola_id,
        escola_nome: escolasMap.get(atuacao.escola_id) || "",
        componente_id: atuacao.componente_id,
        componente_nome: componentesMap.get(atuacao.componente_id) || "",
        turma_id: atuacao.turma_id,
        turma_nome: turmasMap.get(atuacao.turma_id) || ""
      }))
    });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.post("/professores", async (req, res) => {
  try {
    const { nome, turno, email, senha, atribuicoes } = req.body;
    if (!nome || !turno || !email || !senha) {
      return res.status(400).json({ error: "Preencha nome, turno, e-mail e senha." });
    }
    if (!Array.isArray(atribuicoes) || atribuicoes.length === 0) {
      return res.status(400).json({ error: "Adicione pelo menos uma atribuição." });
    }

    const { data: existente, error: errExistente } = await supabase
      .from("professores")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (errExistente) return supabaseError(res, errExistente);
    if (existente) return res.status(400).json({ error: "Já existe um professor com este e-mail." });

    const senhaHash = await bcrypt.hash(senha, 10);
    const { data, error } = await supabase
      .from("professores")
      .insert([{ nome, turno, email, senha: senhaHash }])
      .select("id")
      .single();
    if (error) return supabaseError(res, error);
    const errorAtribuicoes = await inserirAtuacoesProfessor(data.id, atribuicoes);
    if (errorAtribuicoes) return supabaseError(res, errorAtribuicoes);
    res.json({ id: data.id });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.put("/professores/:id", async (req, res) => {
  try {
    const professorId = req.params.id;
    const { nome, turno, email, senha, atribuicoes } = req.body;
    if (!nome || !turno || !email || !senha) {
      return res.status(400).json({ error: "Preencha nome, turno, e-mail e senha." });
    }
    if (!Array.isArray(atribuicoes) || atribuicoes.length === 0) {
      return res.status(400).json({ error: "Adicione pelo menos uma atribuição." });
    }

    const senhaHash = senha.startsWith("$2") ? senha : await bcrypt.hash(senha, 10);

    const { error } = await supabase
      .from("professores")
      .update({ nome, turno, email, senha: senhaHash })
      .eq("id", professorId);
    if (error) {
      if (error.message && error.message.includes("duplicate key value")) {
        return res.status(400).json({ error: "Já existe um professor cadastrado com este e-mail." });
      }
      return supabaseError(res, error);
    }

    const deleteError = await limparAtuacoesProfessor(professorId);
    if (deleteError) return supabaseError(res, deleteError);
    const insertError = await inserirAtuacoesProfessor(professorId, atribuicoes);
    if (insertError) return supabaseError(res, insertError);
    return res.json({ ok: true });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.put("/professores/:id/foto", async (req, res) => {
  try {
    const professorId = req.params.id;
    const { imagemBase64, contentType } = req.body;

    if (!imagemBase64) {
      return res.status(400).json({ error: "Envie uma imagem para atualizar a foto." });
    }

    const imagem = normalizarImagemBase64(imagemBase64, contentType);
    const tipo = imagem.contentType;
    const extensao = extensaoPorMime[tipo];

    if (!extensao) {
      return res.status(400).json({ error: "Formato inválido. Use JPG, PNG ou WEBP." });
    }

    const buffer = Buffer.from(imagem.base64, "base64");
    if (!buffer.length) {
      return res.status(400).json({ error: "Imagem inválida." });
    }

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "A imagem deve ter no máximo 5 MB." });
    }

    const { data: professorAtual, error: errProfessor } = await supabase
      .from("professores")
      .select("id,nome,email,turno,foto_perfil_path")
      .eq("id", professorId)
      .maybeSingle();

    if (errProfessor) return supabaseError(res, errProfessor);
    if (!professorAtual) return res.status(404).json({ error: "Professor não encontrado." });

    const bucket = "professor-fotos";
    const caminho = `${professorId}/perfil-${Date.now()}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(caminho, buffer, {
        contentType: tipo,
        upsert: true
      });

    if (uploadError) return supabaseError(res, uploadError, "Erro ao enviar a foto.");

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(caminho);
    const fotoUrl = publicData.publicUrl;

    const { data: professorAtualizado, error: updateError } = await supabase
      .from("professores")
      .update({
        foto_perfil_url: fotoUrl,
        foto_perfil_path: caminho,
        foto_perfil_atualizada_em: new Date().toISOString()
      })
      .eq("id", professorId)
      .select("id,nome,email,turno,foto_perfil_url,foto_perfil_path,foto_perfil_atualizada_em")
      .single();

    if (updateError) return supabaseError(res, updateError, "Erro ao salvar a foto no cadastro.");

    if (professorAtual.foto_perfil_path && professorAtual.foto_perfil_path !== caminho) {
      await supabase.storage.from(bucket).remove([professorAtual.foto_perfil_path]);
    }

    return res.json({
      ...professorAtualizado,
      perfil: "professor",
      tipo: "professor"
    });
  } catch (error) {
    return supabaseError(res, error, "Erro ao atualizar foto do professor.");
  }
});

app.delete("/professores/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("professores").delete().eq("id", req.params.id);
    if (error) return supabaseError(res, error);
    res.json({ ok: true });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.put("/planos/:id/enviar", async (req, res) => {
  try {
    const { data: plano, error: errPlano } = await supabase
      .from("planos")
      .select("id,componente,ano,periodo")
      .eq("id", req.params.id)
      .maybeSingle();
    if (errPlano) return supabaseError(res, errPlano);
    if (!plano) return res.status(404).json({ error: "Plano não encontrado." });

    const { error: errSubstituir } = await supabase
      .from("planos")
      .update({ envio_status: "substituido" })
      .eq("componente", plano.componente)
      .eq("ano", plano.ano)
      .eq("periodo", plano.periodo)
      .eq("envio_status", "enviado")
      .neq("id", plano.id);
    if (errSubstituir) return supabaseError(res, errSubstituir);

    const { error: errEnviar } = await supabase
      .from("planos")
      .update({ envio_status: "enviado" })
      .eq("id", plano.id);
    if (errEnviar) return supabaseError(res, errEnviar);

    res.json({ ok: true, mensagem: "Modelo enviado com sucesso." });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/professores/:id/modelos", async (req, res) => {
  try {
    const professorId = req.params.id;
    const [{ data: atuacoes, error: errAtuacoes }, { data: planos, error: errPlanos }, { data: planosProfessor, error: errPlanosProfessor }, { data: componentes, error: errComponentes }, { data: turmas, error: errTurmas }] = await Promise.all([
      supabase.from("professor_atuacoes").select("*").eq("professor_id", professorId),
      supabase.from("planos").select("*").eq("envio_status", "enviado"),
      supabase.from("planos_professor").select("professor_id,modelo_id,status").eq("professor_id", professorId),
      supabase.from("componentes").select("id,nome"),
      supabase.from("turmas").select("id,ano,turma")
    ]);

    if (errAtuacoes || errPlanos || errPlanosProfessor || errComponentes || errTurmas) {
      return supabaseError(res, errAtuacoes || errPlanos || errPlanosProfessor || errComponentes || errTurmas);
    }

    if (!atuacoes || atuacoes.length === 0) return res.json([]);

    const componentesMap = new Map((componentes || []).map((item) => [item.id, item.nome]));
    const turmasAnoMap = new Map((turmas || []).map((item) => [item.id, item.ano]));

    const modelosFiltrados = (planos || []).filter((plano) => {
      const componentePlano = normalizarTexto(plano.componente);
      const anoPlano = normalizarAno(plano.ano);
      return (atuacoes || []).some((atuacao) => {
        const componenteAtuacao = normalizarTexto(componentesMap.get(atuacao.componente_id) || "");
        const anoAtuacao = normalizarAno(turmasAnoMap.get(atuacao.turma_id) || "");
        return componenteAtuacao === componentePlano && anoAtuacao === anoPlano;
      });
    });

    const resposta = modelosFiltrados.map((p) => {
      const planoDoProfessor = (planosProfessor || []).find(
        (pp) => Number(pp.professor_id) === Number(professorId) && Number(pp.modelo_id) === Number(p.id)
      );
      return {
        ...parsePlano(p),
        envio_status: p.envio_status || "nao_enviado",
        professor_status: planoDoProfessor?.status || "pendente"
      };
    });

    return res.json(resposta);
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/professores/:professorId/modelos/:modeloId/plano", async (req, res) => {
  try {
    const { professorId, modeloId } = req.params;
    const { data, error } = await supabase
      .from("planos_professor")
      .select("*")
      .eq("professor_id", professorId)
      .eq("modelo_id", modeloId)
      .maybeSingle();
    if (error) return supabaseError(res, error);
    if (!data) return res.json(null);
    return res.json({
      ...data,
      habilidades: parseJSON(data.habilidades),
      objetos: parseJSON(data.objetos),
      metodologias: parseJSON(data.metodologias),
      metodologias_recursos: parseJSON(data.metodologias_recursos),
      instrumentos: parseJSON(data.instrumentos),
      instrumentos_recursos: parseJSON(data.instrumentos_recursos),
      tipos_avaliacao: parseJSON(data.tipos_avaliacao),
      descritores: parseJSON(data.descritores),
      generos: parseJSON(data.generos)
    });
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/planos-professor", async (req, res) => {
  try {
    const { data, error } = await supabase.from("planos_professor").select("id,professor_id,modelo_id,status");
    if (error) return supabaseError(res, error);
    return res.json(data || []);
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.get("/dashboard/coordenador", async (req, res) => {
  try {
    const [{ data: professores, error: errProfessores }, { data: atuacoes, error: errAtuacoes }, { data: componentes, error: errComponentes }, { data: turmas, error: errTurmas }, { data: modelosEnviados, error: errModelos }, { data: planosProfessor, error: errPlanosProfessor }] = await Promise.all([
      supabase.from("professores").select("id,nome").order("nome", { ascending: true }),
      supabase.from("professor_atuacoes").select("*").order("professor_id", { ascending: true }),
      supabase.from("componentes").select("id,nome"),
      supabase.from("turmas").select("id,ano,turma"),
      supabase.from("planos").select("id,componente,ano,periodo,envio_status").eq("envio_status", "enviado").order("id", { ascending: false }),
      supabase.from("planos_professor").select("professor_id,modelo_id,status")
    ]);

    if (errProfessores || errAtuacoes || errComponentes || errTurmas || errModelos || errPlanosProfessor) {
      return supabaseError(res, errProfessores || errAtuacoes || errComponentes || errTurmas || errModelos || errPlanosProfessor);
    }

    const componenteMap = new Map((componentes || []).map((item) => [item.id, item.nome]));
    const turmaAnoMap = new Map((turmas || []).map((item) => [item.id, item.ano]));

    const mapaProfessores = new Map();
    (professores || []).forEach((professor) => {
      mapaProfessores.set(professor.id, {
        id: professor.id,
        nome: professor.nome,
        atribuicoes: []
      });
    });

    (atuacoes || []).forEach((atuacao) => {
      const professor = mapaProfessores.get(atuacao.professor_id);
      if (!professor) return;
      professor.atribuicoes.push({
        componente_nome: componenteMap.get(atuacao.componente_id) || "",
        turma_ano: turmaAnoMap.get(atuacao.turma_id) || ""
      });
    });

    const resposta = Array.from(mapaProfessores.values()).map((professor) => {
      const modelosCompativeis = [];
      const idsJaAdicionados = new Set();
      (modelosEnviados || []).forEach((modelo) => {
        const componenteModelo = normalizarTexto(modelo.componente);
        const anoModelo = normalizarAno(modelo.ano);
        const compativel = (professor.atribuicoes || []).some((atribuicao) => {
          const componenteAtribuicao = normalizarTexto(atribuicao.componente_nome);
          const anoAtribuicao = normalizarAno(atribuicao.turma_ano);
          return componenteAtribuicao === componenteModelo && anoAtribuicao === anoModelo;
        });
        if (compativel && !idsJaAdicionados.has(modelo.id)) {
          idsJaAdicionados.add(modelo.id);
          modelosCompativeis.push(modelo);
        }
      });

      const modelosComStatus = modelosCompativeis.map((modelo) => {
        const planoDoProfessor = (planosProfessor || []).find(
          (pp) => Number(pp.professor_id) === Number(professor.id) && Number(pp.modelo_id) === Number(modelo.id)
        );
        return {
          ...modelo,
          professor_status: planoDoProfessor?.status || "pendente"
        };
      });

      const total = modelosComStatus.length;
      const concluidos = modelosComStatus.filter((item) => statusEhConcluido(item.professor_status)).length;
      const andamento = modelosComStatus.filter((item) => statusEhAndamento(item.professor_status)).length;
      const pendentes = modelosComStatus.filter((item) => statusEhPendente(item.professor_status)).length;
      const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

      return {
        id: professor.id,
        nome: professor.nome,
        total,
        concluidos,
        andamento,
        pendentes,
        percentual
      };
    });

    res.json(resposta);
  } catch (error) {
    return supabaseError(res, error);
  }
});

app.post("/professores/:professorId/modelos/:modeloId/plano", async (req, res) => {
  try {
    const { professorId, modeloId } = req.params;
    const {
      componente,
      ano,
      periodo,
      campo_atuacao,
      descritores,
      generos,
      habilidades,
      objetos,
      metodologias,
      instrumentos,
      instrumentos_recursos,
      tipos_avaliacao,
      metodologias_recursos,
      observacoes,
      status
    } = req.body;

    const { data: existente, error: errExistente } = await supabase
      .from("planos_professor")
      .select("id")
      .eq("professor_id", professorId)
      .eq("modelo_id", modeloId)
      .maybeSingle();
    if (errExistente) return supabaseError(res, errExistente);

    const registro = {
      modelo_id: Number(modeloId),
      professor_id: Number(professorId),
      componente: componente || "",
      ano: ano || "",
      periodo: periodo || "",
      campo_atuacao: campo_atuacao || "",
      descritores: JSON.stringify(descritores || []),
      generos: JSON.stringify(generos || []),
      habilidades: JSON.stringify(habilidades || []),
      objetos: JSON.stringify(objetos || []),
      metodologias: JSON.stringify(metodologias || []),
      metodologias_recursos: JSON.stringify(metodologias_recursos || []),
      instrumentos: JSON.stringify(instrumentos || []),
      instrumentos_recursos: JSON.stringify(instrumentos_recursos || []),
      tipos_avaliacao: JSON.stringify(tipos_avaliacao || []),
      observacoes: observacoes || "",
      status: status || "em_andamento"
    };

    if (existente) {
      const { error } = await supabase
        .from("planos_professor")
        .update(registro)
        .eq("professor_id", professorId)
        .eq("modelo_id", modeloId);
      if (error) return supabaseError(res, error);
      return res.json({ ok: true, mensagem: "Plano do professor atualizado com sucesso." });
    }

    const { error } = await supabase.from("planos_professor").insert([registro]);
    if (error) return supabaseError(res, error);
    return res.json({ ok: true, mensagem: "Plano do professor salvo com sucesso." });
  } catch (error) {
    return supabaseError(res, error);
  }
});

// Servir arquivos estáticos do frontend (dist)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - servir index.html para rotas não encontradas
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});
