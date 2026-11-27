# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Executar com a API do portfólio

1. Em `Back-end`, configure o PostgreSQL conforme o README do back-end e execute `npm start`.
2. Em `Front-End`, execute `npm run dev`. O Vite encaminha `/api` para `http://127.0.0.1:3333`.
3. Abra SESI ou SENAI para consultar os registros. Após salvar no modo de edição, clique em **Atualizar visualização**.

O ano interno dos registros é 2026 por padrão. Para trabalhar com outro ano aceito pela API, defina `VITE_PORTFOLIO_YEAR` no ambiente do front-end. Ao publicar, configure o servidor para encaminhar `/api` à API ou forneça `VITE_API_BASE_URL` durante a compilação. Uma API em outra origem precisa liberar essa origem via CORS.

O login atual é demonstrativo e o back-end atual não tem autenticação de sessão ou autorização de escrita. Use a integração localmente até implementar a proteção das rotas.