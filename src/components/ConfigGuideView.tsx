export function ConfigGuideView() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-medium text-[#ECEEEB]">
          Arquitetura e Configuração do Projeto
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#9CA39E]">
          Guia didático das camadas da Biblioteca Inteligente, opções gratuitas de Inteligência
          Artificial e estrutura de referência em Python + FastAPI para estudo local.
        </p>
      </header>

      {/* Camadas da Arquitetura */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium text-[#ECEEEB]">
          01. Análise da Arquitetura
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#1A1D1B] p-5">
            <h3 className="text-sm font-semibold text-[#8FA893]">Frontend (Interface)</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#D0D5D1]">
              Exibe as estantes (Quero Ler, Lendo, Concluído), busca por título/autor/ISBN e janela
              do chatbot. Nunca armazena chaves de API e comunica-se apenas com as rotas{' '}
              <code className="font-mono-tabular text-[#ECEEEB]">/api/*</code>.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1A1D1B] p-5">
            <h3 className="text-sm font-semibold text-[#8FA893]">Backend (Servidor API)</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#D0D5D1]">
              Recebe os pedidos do navegador, valida dados, consulta o catálogo gratuito da Open
              Library e chama a IA usando variáveis de ambiente protegidas no servidor.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1A1D1B] p-5">
            <h3 className="text-sm font-semibold text-[#8FA893]">Persistência Gratuita</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#D0D5D1]">
              Armazenamento local em arquivo estruturado (<code className="font-mono-tabular">data/library.json</code>{' '}
              nesta execução e <code className="font-mono-tabular">SQLite</code> no modelo Python), sem exigir
              bancos pagos na nuvem.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1A1D1B] p-5">
            <h3 className="text-sm font-semibold text-[#8FA893]">Segurança de Chaves</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#D0D5D1]">
              A variável <code className="font-mono-tabular text-[#ECEEEB]">GEMINI_API_KEY</code> fica
              isolada no servidor (<code className="font-mono-tabular">.env</code> / Secrets). O arquivo{' '}
              <code className="font-mono-tabular">.gitignore</code> impede envio acidental ao GitHub.
            </p>
          </div>
        </div>
      </section>

      {/* Alternativas Gratuitas de IA */}
      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="font-display text-xl font-medium text-[#ECEEEB]">
          02. Opções de IA Gratuitas (Sem Pagamento Obrigatório)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#1A1D1B]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-[#9CA39E]">
              <tr>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Modelo Recomendado</th>
                <th className="px-4 py-3 font-medium">Plano Gratuito</th>
                <th className="px-4 py-3 font-medium">Exige Cartão?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-[#D0D5D1]">
              <tr>
                <td className="px-4 py-3 font-medium text-[#ECEEEB]">Google Gemini (AI Studio)</td>
                <td className="font-mono-tabular px-4 py-3 text-xs text-[#8FA893]">gemini-4-hydrogen</td>
                <td className="px-4 py-3">Sim, cota gratuita diária para testes e estudo</td>
                <td className="px-4 py-3">Não</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#ECEEEB]">Groq Cloud</td>
                <td className="font-mono-tabular px-4 py-3 text-xs">llama-3.3-70b-versatile</td>
                <td className="px-4 py-3">Sim, API rápida compatível com SDKs abertos</td>
                <td className="px-4 py-3">Não</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#ECEEEB]">Ollama (Local)</td>
                <td className="font-mono-tabular px-4 py-3 text-xs">llama3.2 / mistral</td>
                <td className="px-4 py-3">100% gratuito e offline no seu computador</td>
                <td className="px-4 py-3">Não</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Configuração Python FastAPI */}
      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="font-display text-xl font-medium text-[#ECEEEB]">
          03. Como Rodar o Espelho em Python (Estudo Local)
        </h2>
        <p className="text-sm leading-relaxed text-[#9CA39E]">
          O workspace já inclui a pasta <code className="font-mono-tabular text-[#ECEEEB]">python_backend/</code>{' '}
          com <code className="font-mono-tabular text-[#ECEEEB]">app.py</code> (FastAPI + SQLite + SDK{' '}
          <code className="font-mono-tabular text-[#ECEEEB]">google-genai</code>) e{' '}
          <code className="font-mono-tabular text-[#ECEEEB]">requirements.txt</code> para você praticar
          no seu computador:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#121413] p-4 font-mono-tabular text-xs leading-relaxed text-[#C5D6C8]">
{`# 1. Criar ambiente virtual Python (isolado)
python -m venv venv
source venv/bin/activate   # No Windows: venv\\Scripts\\activate

# 2. Instalar dependências gratuitas
pip install -r python_backend/requirements.txt

# 3. Criar arquivo .env (nunca enviar para o Git)
GEMINI_API_KEY=sua_chave_gratuita_aqui

# 4. Iniciar servidor Python FastAPI
uvicorn python_backend.app:app --reload --port 8000`}
        </pre>
      </section>
    </div>
  );
}
