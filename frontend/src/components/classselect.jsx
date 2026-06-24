//classselect.jsx
//授業名と講義回数を選択するための画面
import "./classselect.css";
import { useEffect, useState } from "react";
import { loadClassNames, loadClassCounts } from "../services/classService";
import {
  addFavoriteClass,
  removeFavoriteClass,
  loadFavoriteClasses,
} from "../services/favoriteService";

export default function ClassSelector({
  className,
  setClassName,
  classCount,
  setClassCount,
}) {
  const [classNames, setClassNames] = useState([]);
  const [filteredClassNames, setFilteredClassNames] = useState([]);
  const [counts, setCounts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [favoriteClasses, setFavoriteClasses] = useState([]);

  //初回表示時に授業一覧を取得しお気に入り一覧を取得
  useEffect(() => {
    async function fetchClassNames() {
      try {
        const names = await loadClassNames(); //返り値が授業名の配列
        const favorites = await loadFavoriteClasses(); //お気に入り授業のidを返す配列

        setClassNames(names);
        setFilteredClassNames(names);
        setFavoriteClasses(favorites);
      } catch (error) {
        console.error("授業名取得エラー:", error);
      }
    }

    fetchClassNames();
  }, []);

  //授業選択での処理
  async function selectClass(name) {
    setClassName(name);
    setClassCount(""); //回数は初期化

    try {
      const countList = await loadClassCounts(name); //返り値は配列
      setCounts(countList);
    } catch (error) {
      console.error("回数取得エラー:", error);
      setCounts([]);
    }

    setIsOpen(false);
  }

  //お気に入りボタンを押したときの処理（登録/解除)
  async function handleToggleFavorite(targetClassName) {
    try {
      const isFavorite = favoriteClasses.includes(targetClassName);

      if (isFavorite) {
        //解除処理
        await removeFavoriteClass(targetClassName);
        setFavoriteClasses((prev) =>
          prev.filter((name) => name !== targetClassName),
        );
      } else {
        //登録処理
        await addFavoriteClass(targetClassName);
        setFavoriteClasses((prev) => [...prev, targetClassName]);
      }
    } catch (error) {
      console.error("お気に入り更新エラー:", error);
      alert("お気に入りの更新に失敗しました。");
    }
  }

  //授業名の入力欄に文字を入れたときの処理
  function handleInputChange(e) {
    const value = e.target.value; //イベント発生時のinputタグ
    setClassName(value);
    setClassCount("");
    setCounts([]);
    let filtered;
    if (value.trim()) {
      //文字列が入っていれば含んでる候補をあげる
      filtered = classNames.filter((name) => name.includes(value.trim()));
    } else {
      filtered = classNames; //全授業表示にする
    }

    setFilteredClassNames(filtered);
    setIsOpen(true);
  }

  let comboClass = "combo-wrap";

  if (isOpen) {
    comboClass += " open";
  }
  return (
    <>
      <label htmlFor="class-select">授業名</label>

      <div className={comboClass}>
        <input
          className="combo-input"
          id="class-select"
          type="text"
          value={className}
          onChange={handleInputChange}
          onFocus={() => {
            setFilteredClassNames(classNames);
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="授業名を入力または選択"
          autoComplete="off"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        />

        {isOpen && (
          <ul className="combo-list" role="listbox">
            {filteredClassNames.length === 0 ? (
              <li className="combo-item">候補がありません</li>
            ) : (
              filteredClassNames.map((name) => {
                const isFavorite = favoriteClasses.includes(name);

                return (
                  <li
                    key={name}
                    className="combo-item class-combo-row"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectClass(name);
                    }}
                  >
                    <span>{name}</span>

                    <button
                      type="button"
                      className="favorite-btn"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleFavorite(name);
                      }}
                    >
                      {isFavorite ? "★" : "☆"}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {className && (
        <button
          type="button"
          className="favorite-current-btn"
          onClick={() => handleToggleFavorite(className)}
        >
          {favoriteClasses.includes(className)
            ? "★ お気に入り解除"
            : "☆ お気に入り登録"}
        </button>
      )}

      <label htmlFor="count-select">講義回数</label>

      <select
        id="count-select"
        value={classCount}
        onChange={(e) => setClassCount(e.target.value)}
        disabled={!className || counts.length === 0}
      >
        <option value="">
          {className
            ? "-- 回数を選択してください --"
            : "-- 先に授業名を選択してください --"}
        </option>

        {counts.map((count) => (
          <option key={count} value={count}>
            第 {count} 回
          </option>
        ))}
      </select>
    </>
  );
}
