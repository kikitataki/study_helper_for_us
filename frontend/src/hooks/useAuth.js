import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

export default function useAuth() {
  //初期値がnullとture
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //userだけで管理しようとすると、判定していないのにnullを返したのでloadingで二段階で行う
  //reactは非同期なので初期値をパクって後回しにされるのが原因。
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.getIdToken();
        console.log("ログイン完了", user.email);
        setUser(user);
      } else {
        console.log("未ログイン");
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
