const API = "http://localhost:3000";

// 🔹 LISTAR PLANOS
export const listarPlanos = async () => {
  const res = await fetch(`${API}/planos`);
  return res.json();
};

// 🔹 DELETAR PLANO
export const deletarPlano = async (id) => {
  await fetch(`${API}/planos/${id}`, {
    method: "DELETE",
  });
};

// 🔹 SALVAR PLANO
export async function salvarPlano(plano) {
  const res = await fetch(`${API}/planos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(plano),
  });

  return res.json();
}


// 🔹 BNCC (QUERY)
export async function listarBNCC(componente, ano) {
  const res = await fetch(
    `${API}/bncc/${componente}/${ano}`
  );
  return res.json();
}

// 🔹 BNCC (REST)
export async function buscarBNCC(componente, ano) {
  const res = await fetch(
    `${API}/bncc/${componente}/${ano}`
  );
  return res.json();
}

// 🔹 LISTAR MODELOS
export async function listarModelos() {
  const res = await fetch(`${API}/modelos`);
  return res.json();
}

export const buscarPlano = async (id) => {
  const res = await fetch(`${API}/planos/${id}`);

  if (!res.ok) {
    throw new Error("Plano não encontrado");
  }

  return res.json();
};

export const atualizarPlano = async (id, dados) => {
  const res = await fetch(`${API}/planos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
};
// ===============================
// PROFESSORES
// ===============================

export async function listarProfessores() {
  const res = await fetch(`${API}/professores`);
  return res.json();
}

export async function buscarProfessor(id) {
  const res = await fetch(`${API}/professores/${id}`);
  return res.json();
}

export async function salvarProfessor(professor) {
  const res = await fetch(`${API}/professores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(professor),
  });
  return res.json();
}

export async function atualizarProfessor(id, professor) {
  const res = await fetch(`${API}/professores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(professor),
  });
  return res.json();
}

export async function deletarProfessor(id) {
  const res = await fetch(`${API}/professores/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

// ===============================
// LISTAS AUXILIARES PROFESSORES
// ===============================

export async function listarEscolas() {
  const res = await fetch(`${API}/escolas`);
  return res.json();
}

export async function listarComponentes() {
  const res = await fetch(`${API}/componentes`);
  return res.json();
}

export async function listarTurmas() {
  const res = await fetch(`${API}/turmas`);
  return res.json();
}

// LOGIN
export async function loginUsuario(dados) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  return res.json();
}

// USUÁRIO LOGADO
export async function buscarUsuarioLogado(token) {
  const res = await fetch(`${API}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

// CADASTRAR USUÁRIO
export async function cadastrarUsuario(dados) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  return res.json();
}

// LISTAR USUÁRIOS
export async function listarUsuarios() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/auth/usuarios`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

// DELETAR USUÁRIO
export async function deletarUsuario(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/auth/usuarios/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function enviarModeloPlano(id) {
  const res = await fetch(`${API}/planos/${id}/enviar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const contentType = res.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Resposta inválida do servidor.");
  }

  return res.json();
}

export async function listarModelosProfessor(professorId) {
  const res = await fetch(`${API}/professores/${professorId}/modelos`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.erro || "Erro ao buscar modelos do professor.");
  }

  return data;
}

export async function buscarPlanoProfessor(professorId, modeloId) {
  const res = await fetch(`${API}/professores/${professorId}/modelos/${modeloId}/plano`);
  return res.json();
}

export async function salvarPlanoProfessor(professorId, modeloId, dados) {
  const res = await fetch(`${API}/professores/${professorId}/modelos/${modeloId}/plano`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  return res.json();
}


export const listarPlanosProfessor = async () => {
  const res = await fetch(`${API}/planos-professor`);

  if (!res.ok) {
    throw new Error("Erro ao listar planos do professor");
  }

  return res.json();
};
export const listarResumoDashboardCoordenador = async () => {
  const res = await fetch(`${API}/dashboard/coordenador`);
  
  if (!res.ok) {
    throw new Error("Erro ao listar resumo do dashboard");
  }

  return res.json();
};