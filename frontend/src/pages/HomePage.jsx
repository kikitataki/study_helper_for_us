//urlから授業と回数を取得して表示させる命令部分
//とっていく方法はournoteを参照

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AdminPanel from "../components/admin";
import Classselect from "../components/classselect";
import OurNote from "../components/ournote";
import CommentSection from "../components/comment";

const ADMIN_EMAIL = "konankonan@test.com";

export default function HomePage({ user }) {
  const [className, setClassName] = useState("");
  const [classCount, setClassCount] = useState("");
  //urlから授業と回数を取得する
  //→url設定はNotificationPage.jsx参照
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlClassName = searchParams.get("className"); //授業の取得
    const urlClassCount = searchParams.get("classCount"); //回数の取得

    if (urlClassName && urlClassCount) {
      setClassName(urlClassName);
      setClassCount(urlClassCount);
    }
  }, [searchParams]); //urlが変わるごとに実行する

  return (
    <>
      {user.email === ADMIN_EMAIL && <AdminPanel />}

      <Classselect
        className={className}
        setClassName={setClassName}
        classCount={classCount}
        setClassCount={setClassCount}
      />
      {/* 授業表示部分 */}
      <OurNote className={className} classCount={classCount} />

      <CommentSection className={className} classCount={classCount} />
    </>
  );
}
