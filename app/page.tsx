import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, BookOpen, Download, Upload, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-center md:text-left md:w-1/2">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-blue-900">
              FST Cloud
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Your central hub for academic resources. Share and access study materials
              with fellow students in a seamless, organized way.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Login
              </button>
              <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors">
                Sign Up
              </button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
              alt="Students collaborating"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            How FST Cloud Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1: Sign Up */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Create Account</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign up with your email in seconds. No complicated forms - just quick access to all features.
              </p>
            </div>

            {/* Step 2: Upload */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Share Resources</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your study materials easily. Add tags and descriptions to help others find them.
              </p>
            </div>

            {/* Step 3: Download */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Access Materials</h3>
              <p className="text-gray-600 leading-relaxed">
                Download study materials instantly. Find exactly what you need with our smart search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose FST Cloud?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Organized Learning</h3>
              </div>
              <p className="text-gray-600">
                All materials are neatly categorized by course and level, making it easy to find what you need.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <ArrowRight className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">Instant Access</h3>
              </div>
              <p className="text-gray-600">
                Download materials instantly and start studying right away. No waiting, no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© {new Date().getFullYear()} FST Cloud. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}