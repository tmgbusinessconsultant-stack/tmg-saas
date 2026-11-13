"use client";
export default function GoogleLoginButton() {
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/i, "");
  const go = () => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${api}/api/auth/google/login`;
  };
  return (
    <button onClick={go} type="button" style={{width:"100%",padding:"12px",borderRadius:999,background:"#fff",color:"#1f2937",fontWeight:800,fontSize:15,marginTop:12,cursor:"pointer",border:"1px solid #d1d5db"}}>
      Continue with Google
    </button>
  );
}
