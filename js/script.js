const SUPABASE_URL = 'https://ijjayztvfmtgtzecsieu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqamF5enR2Zm10Z3R6ZWNzaWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDYzNTMsImV4cCI6MjA3MDA4MjM1M30.c-aoXO2joLhpzoxZZulLoqEnq0G9ACNLyLavQrFM1e0';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tabela = document.getElementById('tabela-colaboradores');
const filtroEspecialidade = document.getElementById('filtro-especialidade');
const filtroContrato = document.getElementById('filtro-contrato');
const filtroBusca = document.getElementById('filtro-busca');
const mensagemErro = document.getElementById('mensagem-erro');
const limparFiltrosBtn = document.getElementById('limpar-filtros');
const modalEditar = document.getElementById('modal-editar');
const formEditar = document.getElementById('form-editar');
const modalFechar = document.getElementById('modal-fechar');
const modalDeletar = document.getElementById('modal-deletar');
const modalAjustePonto = document.getElementById('modal-ajuste-ponto');
const modalAjusteFechar = document.getElementById('modal-ajuste-fechar');
const montarEmailBtn = document.getElementById('montar-email');
const modalEmail = document.getElementById('modal-email');
const modalEmailFechar = document.getElementById('modal-email-fechar');
const copiarEmailBtn = document.getElementById('copiar-email');
const adicionarDataBtn = document.getElementById('adicionar-data');
const datasLista = document.getElementById('datas-lista');
const ajusteDatasInput = document.getElementById('ajuste-datas');
const hora = new Date().getHours();
let saudacao = '';

if (hora < 12) {
  saudacao = 'Bom dia';
} else if (hora < 18) {
  saudacao = 'Boa tarde';
} else {
  saudacao = 'Boa noite';
}

let dados = [];
let colunaOrdenada = 'colaborador';
let direcaoOrdenada = 'asc';
let datasSelecionadas = [];
function formatarCPF(cpf) {
  if (!cpf) return 'Sem CPF';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
function limparCPF(cpf) {
  return cpf.replace(/[^\d]/g, '');
}
function aplicarMascaraCPF(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (value.length <= 11) {
      e.target.value = value.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (match, p1, p2, p3, p4) => {
        return p1 + (p2 ? '.' + p2 : '') + (p3 ? '.' + p3 : '') + (p4 ? '-' + p4 : '');
      });
    }
  });
}
function getImagemColaborador(nome) {
  const cleanedNome = nome.trim();
  const nomeArquivo = `${cleanedNome}.png`;
  const caminho = `img/Backup_img_colab/${nomeArquivo}`;
  console.log(`Tentando carregar imagem para "${cleanedNome}": ${caminho}`);
  return caminho;
}
async function carregarDados() {
  tabela.innerHTML = '<tr><td colspan="7" class="carregando"><div class="spinner"></div> Carregando...</td></tr>';
  mensagemErro.style.display = 'none';
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('colaborador', { ascending: true });
  if (error) {
    tabela.innerHTML = '<tr><td colspan="7" class="carregando">Erro ao carregar dados.</td></tr>';
    mensagemErro.textContent = 'Erro ao buscar dados: ' + error.message;
    mensagemErro.style.display = 'block';
    console.error('Erro ao buscar dados:', error);
    return;
  }
  console.log('Dados carregados do Supabase:', data);
  dados = data;
  preencherFiltros();
  exibirTabela();
}
function preencherFiltros() {
  const especialidades = [...new Set(dados.map(d => d.especialidade || 'Sem especialidade'))];
  let contratos = [...new Set(dados.map(d => d.contratos || 'Sem contrato'))];
  if (contratos.length === 1 && contratos[0] === 'Sem contrato') {
    contratos = ['CLT', 'PJ', 'Estágio', 'Temporário'];
  }
  filtroEspecialidade.innerHTML = '<option value="">Todos</option>';
  filtroContrato.innerHTML = '<option value="">Todos</option>';
  document.getElementById('editar-contrato').innerHTML = '<option value="">Selecione</option>';
  especialidades.forEach(e => {
    const option = document.createElement('option');
    option.value = e;
    option.textContent = e;
    filtroEspecialidade.appendChild(option);
  });
  contratos.forEach(c => {
    const optionFiltro = document.createElement('option');
    optionFiltro.value = c;
    optionFiltro.textContent = c;
    filtroContrato.appendChild(optionFiltro);
    const optionEditar = document.createElement('option');
    optionEditar.value = c;
    optionEditar.textContent = c;
    document.getElementById('editar-contrato').appendChild(optionEditar);
  });
  console.log('Opções de contrato preenchidas:', contratos);
}
function exibirTabela() {
  const esp = filtroEspecialidade.value;
  const con = filtroContrato.value;
  const busca = filtroBusca.value.toLowerCase();
  const filtrado = dados.filter(d =>
    (esp === '' || d.especialidade === esp) &&
    (con === '' || d.contratos === con) &&
    (busca === '' || d.colaborador.toLowerCase().includes(busca))
  );
  filtrado.sort((a, b) => {
    const valorA = a[colunaOrdenada] || '';
    const valorB = b[colunaOrdenada] || '';
    if (direcaoOrdenada === 'asc') {
      return valorA.toString().localeCompare(valorB.toString());
    } else {
      return valorB.toString().localeCompare(valorA.toString());
    }
  });
  if (filtrado.length === 0) {
    tabela.innerHTML = '<tr><td colspan="7" class="carregando">Nenhum colaborador encontrado.</td></tr>';
    return;
  }
  tabela.innerHTML = filtrado.map(d => {
    const imagemSrc = getImagemColaborador(d.colaborador);
    return `
      <tr>
        <td><img src="${imagemSrc}" alt="Foto de ${d.colaborador}" data-id="${d.id || ''}" class="foto-colaborador" style="cursor: pointer;" onerror="this.src='img/Backup_img_colab/SEM FOTO.png'; console.error('Erro 404: Imagem não encontrada em ${imagemSrc}');"></td>
        <td>${d.colaborador}</td>
        <td>${d.matricula}</td>
        <td>${formatarCPF(d.cpf)}</td>
        <td>${d.especialidade || 'Sem especialidade'}</td>
        <td>${d.contato}</td>
        <td><button class="botao-editar" data-id="${d.id || ''}" aria-label="Editar ${d.colaborador}">✏️</button></td>
      </tr>
    `;
  }).join('');
  document.querySelectorAll('th').forEach(th => {
    th.classList.remove('asc', 'desc');
    if (th.getAttribute('data-coluna') === colunaOrdenada) {
      th.classList.add(direcaoOrdenada);
    }
  });
  document.querySelectorAll('.botao-editar').forEach(btn => {
    btn.removeEventListener('click', abrirModalEditarHandler);
    btn.addEventListener('click', abrirModalEditarHandler);
  });
  document.querySelectorAll('.foto-colaborador').forEach(img => {
    img.removeEventListener('click', abrirModalAjustePontoHandler);
    img.addEventListener('click', abrirModalAjustePontoHandler);
  });
}
function abrirModalEditarHandler() {
  const id = this.getAttribute('data-id');
  console.log('Botão Editar clicado, ID:', id);
  abrirModalEditar(id);
}
function abrirModalAjustePontoHandler() {
  const id = this.getAttribute('data-id');
  console.log('Foto clicada, ID:', id);
  abrirModalAjustePonto(id);
}
function abrirModalEditar(id) {
  console.log('Abrindo modal para ID:', id);
  const colaborador = dados.find(d => String(d.id) === id);
  if (!colaborador) {
    console.error('Colaborador não encontrado para ID:', id);
    console.log('Dados disponíveis:', dados);
    mensagemErro.textContent = 'Erro: Colaborador não encontrado. Verifique se o banco de dados possui um campo "id" válido.';
    mensagemErro.style.display = 'block';
    return;
  }
  document.getElementById('editar-id').value = colaborador.id;
  document.getElementById('editar-colaborador').value = colaborador.colaborador;
  document.getElementById('editar-matricula').value = colaborador.matricula;
  document.getElementById('editar-cpf').value = formatarCPF(colaborador.cpf);
  document.getElementById('editar-especialidade').value = colaborador.especialidade || '';
  document.getElementById('editar-contrato').value = colaborador.contratos || '';
  document.getElementById('editar-contato').value = colaborador.contato;
  const modalFoto = document.getElementById('modal-foto-colaborador');
  if (modalFoto) {
    modalFoto.src = getImagemColaborador(colaborador.colaborador);
    modalFoto.alt = `Foto de ${colaborador.colaborador}`;
  } else {
    console.error('Elemento #modal-foto-colaborador não encontrado no DOM');
  }
  modalEditar.style.display = 'flex';
  modalEditar.setAttribute('aria-hidden', 'false');
  document.getElementById('editar-colaborador').focus();
}
function abrirModalAjustePonto(id) {
  console.log('Abrindo modal de ajuste de ponto para ID:', id);
  const colaborador = dados.find(d => String(d.id) === id);
  if (!colaborador) {
    console.error('Colaborador não encontrado para ID:', id);
    console.log('Dados disponíveis:', dados);
    mensagemErro.textContent = 'Erro: Colaborador não encontrado. Verifique se o banco de dados possui um campo "id" válido.';
    mensagemErro.style.display = 'block';
    return;
  }
  document.getElementById('ajuste-colaborador').textContent = colaborador.colaborador;
  document.getElementById('ajuste-matricula').textContent = colaborador.matricula;
  document.getElementById('ajuste-cpf').textContent = formatarCPF(colaborador.cpf);
  document.getElementById('ajuste-especialidade').textContent = colaborador.especialidade || 'Sem especialidade';
  document.getElementById('ajuste-contrato').textContent = colaborador.contratos || 'Sem contrato';
  document.getElementById('ajuste-contato').textContent = colaborador.contato;
  const modalFoto = document.getElementById('modal-ajuste-foto-colaborador');
  if (modalFoto) {
    modalFoto.src = getImagemColaborador(colaborador.colaborador);
    modalFoto.alt = `Foto de ${colaborador.colaborador}`;
  } else {
    console.error('Elemento #modal-ajuste-foto-colaborador não encontrado no DOM');
  }
  // Limpar o input de datas e a lista
  ajusteDatasInput.value = '';
  datasSelecionadas = [];
  datasLista.innerHTML = '';
  modalAjustePonto.style.display = 'flex';
  modalAjustePonto.setAttribute('aria-hidden', 'false');
  document.getElementById('modal-ajuste-fechar').focus();
}

function montarEmail() {
  const colaborador = document.getElementById('ajuste-colaborador').textContent;
  const matricula = document.getElementById('ajuste-matricula').textContent;
  const cpf = document.getElementById('ajuste-cpf').textContent;
  const contrato = document.getElementById('ajuste-contrato').textContent;
  const contato = document.getElementById('ajuste-contato').textContent;
  if (datasSelecionadas.length === 0) {
    mensagemErro.textContent = 'Por favor, adicione pelo menos uma data para ajuste.';
    mensagemErro.style.display = 'block';
    setTimeout(() => {
      mensagemErro.style.display = 'none';
    }, 2000);
    return;
  }
  const datasFormatadas = `\n${datasSelecionadas
    .map(data => new Date(data).toLocaleDateString('pt-BR'))
    .join('\n')}\n\n`;
  const email = `Destinatário: ponto1@servitium.com.br; rh@servitium.com.br;
Cc: renatohenrique@compesa.com.br; luannesilva@compesa.com.br;
Assunto: Ajuste de Ponto do colaborador ${colaborador}, matrícula ${matricula} - CMA SUL/GPM

${saudacao}!

Como coordenador da área de manutenção da CMA SUL na ETA PIRAPAMA e responsável pela equipe de manutenção, operação e administrativa das unidades da CPR SUL/CMA SUL da Servitium, gostaria de informar que o colaborador ${colaborador}, matrícula ${matricula}, CPF ${cpf}, da especialidade Servente de Obras, do contrato ${contrato}, desempenhou suas atividades normalmente conforme o horário estabelecido nos dias:
${datasFormatadas}O colaborador mencionou ter encontrado dificuldades para registrar o ponto nesses dias, o que impossibilitou a validação dos registros.
Solicito gentilmente que sejam realizados os ajustes necessários no sistema para inclusão dos dias de trabalho do colaborador mencionado.

Contato do Colaborador: ${contato} (Whatsapp)`;
  return email;
}
function abrirModalEmail() {
  const emailConteudo = document.getElementById('email-conteudo');
  const email = montarEmail();
  if (!email) return;
  emailConteudo.textContent = email;
  modalEmail.style.display = 'flex';
  modalEmail.setAttribute('aria-hidden', 'false');
  document.getElementById('copiar-email').focus();
}
function copiarEmail() {
  const emailConteudo = document.getElementById('email-conteudo').textContent;
  navigator.clipboard.writeText(emailConteudo).then(() => {
    mensagemErro.textContent = 'Email copiado com sucesso!';
    mensagemErro.style.backgroundColor = '#1a8b1a';
    mensagemErro.style.display = 'block';
    setTimeout(() => {
      mensagemErro.style.display = 'none';
      mensagemErro.style.backgroundColor = '#820A1C';
    }, 2000);
  }).catch(err => {
    mensagemErro.textContent = 'Erro ao copiar o email: ' + err.message;
    mensagemErro.style.display = 'block';
    console.error('Erro ao copiar email:', err);
  });
}
function adicionarData() {
  const data = ajusteDatasInput.value;
  if (data) {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
    if (!datasSelecionadas.includes(data)) {
      datasSelecionadas.push(data);
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${dataFormatada}</span>
        <button class="botao-remover-data" data-data="${data}" aria-label="Remover data ${dataFormatada}">🗑️</button>
      `;
      datasLista.appendChild(li);
      li.querySelector('.botao-remover-data').addEventListener('click', () => removerData(data));
    }
    ajusteDatasInput.value = '';
  }
}
function removerData(data) {
  datasSelecionadas = datasSelecionadas.filter(d => d !== data);
  const lis = datasLista.querySelectorAll('li');
  lis.forEach(li => {
    if (li.querySelector('.botao-remover-data').getAttribute('data-data') === data) {
      li.remove();
    }
  });
}
async function salvarEdicao(event) {
  event.preventDefault();
  mensagemErro.style.display = 'none';
  const id = document.getElementById('editar-id').value;
  const colaborador = document.getElementById('editar-colaborador').value.trim();
  const matricula = document.getElementById('editar-matricula').value.trim();
  const cpf = limparCPF(document.getElementById('editar-cpf').value);
  const especialidade = document.getElementById('editar-especialidade').value.trim() || null;
  const contratos = document.getElementById('editar-contrato').value;
  const contato = document.getElementById('editar-contato').value.trim();
  console.log('Valores do formulário de edição:', { colaborador, matricula, cpf, especialidade, contratos, contato });
  if (!colaborador || !matricula || !contratos || contratos === '' || !contato) {
    mensagemErro.textContent = 'Nome, matrícula, contrato e contato são obrigatórios.';
    mensagemErro.style.display = 'block';
    return;
  }
  if (cpf.length !== 11 || isNaN(cpf)) {
    mensagemErro.textContent = 'CPF deve ter 11 dígitos numéricos.';
    mensagemErro.style.display = 'block';
    return;
  }
  const { error } = await supabase
    .from('colaboradores')
    .update({ colaborador, matricula, cpf, especialidade, contratos, contato })
    .eq('id', id);
  if (error) {
    mensagemErro.textContent = 'Erro ao salvar: ' + error.message;
    mensagemErro.style.display = 'block';
    console.error('Erro ao salvar:', error);
    return;
  }
  mensagemErro.textContent = 'Colaborador atualizado com sucesso!';
  mensagemErro.style.backgroundColor = '#1a8b1a';
  mensagemErro.style.display = 'block';
  setTimeout(() => {
    mensagemErro.style.display = 'none';
    mensagemErro.style.backgroundColor = '#820A1C';
  }, 2000);
  await carregarDados();
  modalEditar.style.display = 'none';
  modalEditar.setAttribute('aria-hidden', 'true');
}
async function deletarColaborador() {
  const id = document.getElementById('editar-id').value;
  const colaborador = document.getElementById('editar-colaborador').value.trim();
  if (!window.confirm(`Tem certeza que deseja deletar o colaborador "${colaborador}"? Esta ação não pode be desfeita.`)) {
    return;
  }
  mensagemErro.style.display = 'none';
  const { error } = await supabase
    .from('colaboradores')
    .delete()
    .eq('id', id);
  if (error) {
    mensagemErro.textContent = 'Erro ao deletar: ' + error.message;
    mensagemErro.style.display = 'block';
    console.error('Erro ao deletar:', error);
    return;
  }
  mensagemErro.textContent = 'Colaborador deletado com sucesso!';
  mensagemErro.style.backgroundColor = '#1a8b1a';
  mensagemErro.style.display = 'block';
  setTimeout(() => {
    mensagemErro.style.display = 'none';
    mensagemErro.style.backgroundColor = '#820A1C';
  }, 2000);
  await carregarDados();
  modalEditar.style.display = 'none';
  modalEditar.setAttribute('aria-hidden', 'true');
}
function limparFiltros() {
  filtroBusca.value = '';
  filtroEspecialidade.value = '';
  filtroContrato.value = '';
  exibirTabela();
}
document.querySelectorAll('th[data-coluna]').forEach(th => {
  th.addEventListener('click', () => {
    const coluna = th.getAttribute('data-coluna');
    if (coluna === 'foto') return;
    if (coluna === colunaOrdenada) {
      direcaoOrdenada = direcaoOrdenada === 'asc' ? 'desc' : 'asc';
    } else {
      colunaOrdenada = coluna;
      direcaoOrdenada = 'asc';
    }
    exibirTabela();
  });
});
filtroEspecialidade.addEventListener('change', exibirTabela);
filtroContrato.addEventListener('change', exibirTabela);
filtroBusca.addEventListener('input', exibirTabela);
limparFiltrosBtn.addEventListener('click', limparFiltros);
formEditar.addEventListener('submit', salvarEdicao);
modalFechar.addEventListener('click', () => {
  modalEditar.style.display = 'none';
  modalEditar.setAttribute('aria-hidden', 'true');
});
modalDeletar.addEventListener('click', deletarColaborador);
modalAjusteFechar.addEventListener('click', () => {
  modalAjustePonto.style.display = 'none';
  modalAjustePonto.setAttribute('aria-hidden', 'true');
});
montarEmailBtn.addEventListener('click', abrirModalEmail);
modalEmailFechar.addEventListener('click', () => {
  modalEmail.style.display = 'none';
  modalEmail.setAttribute('aria-hidden', 'true');
});
copiarEmailBtn.addEventListener('click', copiarEmail);
adicionarDataBtn.addEventListener('click', adicionarData);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (modalEditar.style.display === 'flex') {
      modalEditar.style.display = 'none';
      modalEditar.setAttribute('aria-hidden', 'true');
    }
    if (modalAjustePonto.style.display === 'flex') {
      modalAjustePonto.style.display = 'none';
      modalAjustePonto.setAttribute('aria-hidden', 'true');
    }
    if (modalEmail.style.display === 'flex') {
      modalEmail.style.display = 'none';
      modalEmail.setAttribute('aria-hidden', 'true');
    }
  }
});
aplicarMascaraCPF(document.getElementById('editar-cpf'));
carregarDados();