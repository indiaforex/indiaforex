import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Admin",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (
                    credentials &&
                    credentials.email === process.env.ADMIN_EMAIL &&
                    credentials.password === process.env.ADMIN_PASSWORD
                ) {
                    return { id: "1", name: "Admin", email: credentials.email };
                }
                return null;
            },
        }),
    ],
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
