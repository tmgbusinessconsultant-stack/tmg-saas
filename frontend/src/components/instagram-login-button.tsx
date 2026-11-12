"use client";
export default function InstagramLoginButton() {
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/i, "");
  return <button onClick={() => { window.location.href = `${api}/api/auth/instagram/login`; }} type="button" style={{width:"100%",padding:"12px",borderRadius:999,background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",color:"#fff",fontWeight:800,fontSize:15,marginTop:12,cursor:"pointer",border:"none"}}>Continue with Instagram</button>;
}
