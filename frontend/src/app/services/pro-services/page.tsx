"use client";
import Link from "next/link";
export default function ServicePage(){
  const service = "pro-services";
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/services" className="text-sm text-gray-500">← Services</Link>
      <h1 className="text-3xl font-bold mt-2">PRO Services</h1>
      <p className="text-gray-500 mt-2">Advanced service - connected to quote + booking</p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-xl"><h3 className="font-bold">What we do</h3><p className="text-sm mt-2 text-gray-600">Full pro-services service with TMG expertise, connected to Projects and Documents.</p></div>
        <div className="p-6 border rounded-xl bg-black text-white"><h3 className="font-bold">Get Started</h3><div className="mt-4 flex flex-col gap-2"><Link href="/quote" className="bg-white text-black py-2 rounded text-center">Get Quote</Link><Link href="/booking" className="border border-white py-2 rounded text-center">Book Consultation</Link><Link href="/contact" className="text-sm text-gray-300 mt-2 text-center">Contact Us</Link></div></div>
      </div>
    </div>
  );
}

