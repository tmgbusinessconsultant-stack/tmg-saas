"use client";
export default function FacebookLoginButton() {
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/i, "");
  const go = () => { window.location.href = `${api}/api/auth/facebook/login`; };
  return (
    <button onClick={go} type="button" style={{width:"100%",padding:"12px",borderRadius:999,background:"#1877F2",color:"#fff",fontWeight:800,fontSize:15,marginTop:12,cursor:"pointer",border:"none"}}>
      Continue with Facebook
    </button>
  );
}
