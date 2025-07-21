import { NextAuthOptions, User } from 'next-auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Database } from '@/types/supabase';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  }
}

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Sign in with Supabase
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !user) {
          throw new Error('Invalid credentials');
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile) {
          throw new Error('User profile not found');
        }

        return {
          id: user.id,
          email: user.email,
          name: profile.full_name,
          role: profile.role || 'user',
        };
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.name = token.name || null;
        session.user.email = token.email || null;
        session.user.role = token.role as string || 'user';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role || 'user';
      }
      return token;
    },
  },
};
