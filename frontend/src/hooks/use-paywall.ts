"use client";
import { useState } from "react";
export function usePaywall() {
  const [modal, setModal] = useState<{open:boolean, code?:string, message?:string, required?:string[], current?:string|null}>({open:false});
  const checkPaywall = async (res: Response) => {
    if (res.status===401||res.status===403) {
      const data = await res.clone().json().catch(()=>({}));
      setModal({open:true, code:data.code, message:data.message, required:data.required, current:data.current});
      return true;
    }
    return false;
  };
  return { modal, setModal, checkPaywall };
}
