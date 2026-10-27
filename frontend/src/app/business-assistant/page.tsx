import Link from "next/link";
export default function BusinessAssistantPage(){
  return (
    <div className="p-10 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold">Business Assistant - Advanced Moved</h1>
      <p className="mt-2 text-gray-500">This page is now under AI Tools with advanced features</p>
      <Link href="/ai-tools/business-assistant" className="mt-6 inline-block bg-black text-white px-8 py-3 rounded-xl">Go to Advanced Assistant</Link>
      <div className="mt-4"><Link href="/ai-tools" className="text-sm text-gray-500">All Tools</Link></div>
    </div>
  );
}
