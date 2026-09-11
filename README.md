# GameCode 🎮

A modern, full-stack Next.js application built with performance and aesthetics in mind.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Payments:** [Razorpay](https://razorpay.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Package Manager:** [Bun](https://bun.sh/)

## ✨ Features

- Fully responsive and accessible UI components.
- Modern routing and layouts with Next.js App Router.
- Secure authentication system powered by NextAuth and bcryptjs.
- Database integration with Prisma ORM.
- Payment gateway integration using Razorpay.
- Built-in drag-and-drop support (`@dnd-kit`).
- Interactive charts using Recharts.
- Multi-language support configuration ready (`next-intl`).
- Dark mode ready with `next-themes`.

## 🛠️ Getting Started

### Prerequisites

Make sure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/meetpixeleyez/GameCode.git
   cd GameCode
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up the environment variables:
   - Duplicate the `.env.example` file (if available) or create a `.env` file in the root directory.
   - Add the necessary API keys, Database URLs, NextAuth secrets, and Razorpay credentials.

4. Initialize the Database:
   ```bash
   bun run db:push
   bun run db:generate
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

- `bun run dev` - Starts the development server on port 3000.
- `bun run build` - Builds the application for production (standalone mode).
- `bun run start` - Starts the production server using Bun.
- `bun run lint` - Runs ESLint to catch and fix code issues.
- `bun run db:push` - Pushes the Prisma schema state to the database.
- `bun run db:generate` - Generates the Prisma Client.
- `bun run db:migrate` - Applies migrations to the development database.
- `bun run db:reset` - Resets the database and applies all migrations.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is licensed under the MIT License.
