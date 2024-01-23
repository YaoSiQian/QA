import {
  createSignal,
  onMount,
  onCleanup,
  Show,
  Index,
  createEffect,
} from "solid-js";
import { defaultToggleSetting } from "@/default";
import throttle from "just-throttle";
import {
  clearCustomKey,
  getCustomKey,
  setCustomKey,
  hideKey,
  getRandomInt,
  getCreditGrants,
  generateSignature,
} from "@/utils";
import MessageItem from "./MessageItem";
import Setting from "./Setting";
import TextError from "./Error";
import Footer from "./Footer";
import About from "./About";
import BottomTool from "./BottomTool";
import LoadingDots from "./icons/LoadingDots";
import IconClear from "./icons/Clear";
import IconSend from "./icons/Send";
import IconStop from "./icons/Stop";
import type { ChatMessage } from "@/types";

export type Setting = typeof defaultToggleSetting;

export default () => {
  let inputRef: HTMLTextAreaElement;
  let inputKeyRef: HTMLInputElement;
  let autoScrolling = true;
  const eventTypes = ["wheel", "touchmove", "keydown"];

  const [messageList, setMessageList] = createSignal<ChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] =
    createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [controller, setController] = createSignal<AbortController>(null);
  const [balance, setBalance] = createSignal("--");
  const [setting, setSetting] = createSignal(defaultToggleSetting);

  onMount(() => {
    if (getCustomKey() !== "") {
      getCreditGrants(getCustomKey()).then((res) => {
        setBalance(res);
      });
    }

    eventTypes.forEach((type) => {
      window.addEventListener(type, eventHandler, { passive: false });
    });

    const storage = localStorage.getItem("setting");
    const session = localStorage.getItem("session");
    try {
      let autoSaveSession = false;
      if (storage) {
        const parsed = JSON.parse(storage);
        autoSaveSession = parsed.autoSaveSession;

        setSetting({
          ...defaultToggleSetting,
          ...parsed,
        });
      }
      if (session && autoSaveSession) {
        setMessageList(JSON.parse(session));
      }
    } catch {
      setError("解析缓存设置出错");
    }
  });

  createEffect(() => {
    localStorage.setItem("setting", JSON.stringify(setting()));
    if (setting().autoSaveSession)
      localStorage.setItem("session", JSON.stringify(messageList()));
  });

  onCleanup(() => {
    eventTypes.forEach((type) => {
      window.removeEventListener(type, eventHandler);
    });
  });

  const eventHandler = (e) => {
    if (e.type === "keydown") {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
      }
    }
    stopAutoScroll();
  };
  const startAutoScroll = throttle(
    () => {
      if (autoScrolling) {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    },
    250,
    { leading: true, trailing: false }
  );
  const stopAutoScroll = () => {
    if (loading) {
      autoScrolling = false;
    }
  };

  const handleButtonClick = async () => {
    if (
      getCustomKey() === "" &&
      inputKeyRef.value === "" &&
      !setting().useFreeKey
    ) {
      setError("API 密钥不能为空");
      setCurrentAssistantMessage("");
      return;
    }

    const inputValue = inputRef.value;
    if (!inputValue || /^\n+$/.test(inputValue)) {
      return;
    }

    setMessageList([
      ...messageList(),
      {
        role: "user",
        content: inputValue,
      },
    ]);
    requestWithLatestMessage();
  };
  const requestKeyBalance = async () => {
    if (inputKeyRef.value !== "") {
      getCreditGrants(inputKeyRef.value).then((res) => {
        setBalance(res);
      });
    }
  };
  const requestWithLatestMessage = async () => {
    autoScrolling = true;
    setLoading(true);
    setCurrentAssistantMessage("");
    try {
      const controller = new AbortController();
      setController(controller);
      const requestMessageList = [...messageList()];

      setError("");
      setCustomKey(inputKeyRef.value);

      inputKeyRef.value = "";
      inputKeyRef.placeholder =
        getCustomKey() !== ""
          ? hideKey(getCustomKey())
          : "API 密钥（测试用）";

      const timestamp = Date.now();
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          messages: requestMessageList,
          customKey: getCustomKey(),
          time: timestamp,
          sign: await generateSignature({
            t: timestamp,
            m:
              requestMessageList?.[requestMessageList.length - 1]?.content ||
              "",
          }),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        setLoading(false);
        setError("响应出错了");
        throw new Error(response.statusText);
      }
      const data = response.body;
      if (!data) {
        throw new Error("No data");
      }
      const reader = data.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          let char = decoder.decode(value);
          if (char === "\n" && currentAssistantMessage().endsWith("\n")) {
            continue;
          }
          if (char) {
            setCurrentAssistantMessage(currentAssistantMessage() + char);
          }
          startAutoScroll();
        }
        done = readerDone;
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setController(null);
      inputRef.focus();
      return;
    }
    archiveCurrentMessage();
  };
  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: "assistant",
          content: currentAssistantMessage(),
        },
      ]);
      setCurrentAssistantMessage("");
      setLoading(false);
      setController(null);
      inputRef.focus();
    }
  };
  const clear = () => {
    inputRef.value = "";
    inputRef.style.height = "auto";
    setMessageList([]);
    setCurrentAssistantMessage("");
    inputRef.focus();
  };

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort();
      archiveCurrentMessage();
    }
  };
  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1];
      if (lastMessage.role === "assistant") {
        setMessageList(messageList().slice(0, -1));
        requestWithLatestMessage();
      }
    }
  };
  const handleDeleteMsg = (index: number) => {
    setMessageList(messageList().slice(0, index));
  };
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey) {
      return;
    }
    if (e.key === "Enter") {
      startAutoScroll();
      handleButtonClick();
    }
  };

  const PROMPTS_CACHE_KEY = 'cachedPrompts';
  const fetchPrompts = async () => {
    try {
      const response = await fetch('https://asr-1259380910.cos.ap-shanghai.myqcloud.com/prompts-psy.json');
      if (!response.ok) throw new Error('Network response was not ok.');
      const data = await response.json();
      // 缓存数据到LocalStorage
      localStorage.setItem(PROMPTS_CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      return null;
    }
  };
  const getCachedPrompts = () => {
    // 从LocalStorage中获取缓存的数据
    const cachedData = localStorage.getItem(PROMPTS_CACHE_KEY);
    if (cachedData) return JSON.parse(cachedData);
    return null;
  };
  const handleRandomPrompt = async () => {
    // 尝试从缓存中获取数据，如果没有则发起请求
    let promptsList = getCachedPrompts();
    if (!promptsList) {
      promptsList = await fetchPrompts();
    }
  
    if (promptsList) {
      const _index = getRandomInt(0, promptsList.length - 1);
      inputRef.value = promptsList[_index].prompt;
      inputRef.style.height = 'auto';
      inputRef.style.height = inputRef.scrollHeight + 'px';
    }
  };
  
  

  const renderAdvancedSettings = () => (
    <ul class="tree">
      <li>
        <details mb-4>
          <summary text-slate>高级设置</summary>
          <div class="mt-4 pb-2">
            <div class="api-key">
              <div class="flex">
                <input
                  ref={inputKeyRef!}
                  type="text"
                  disabled
                  placeholder={`${
                    getCustomKey() !== ""
                      ? hideKey(getCustomKey())
                      : "API 密钥（测试用）"
                  }`}
                  onBlur={requestKeyBalance}
                  autocomplete="off"
                  w-full
                  px-4
                  py-2
                  h-10
                  min-h-10
                  text-slate-700
                  rounded-l
                  bg-slate
                  bg-op-15
                  focus:bg-op-20
                  focus:ring-0
                  focus:outline-none
                  placeholder:text-slate-900
                  placeholder:op-30
                />
                <button
                  disabled
                  title="清空密钥"
                  onClick={() => {
                    clearCustomKey();
                    setBalance("--");
                    inputKeyRef.value = "";
                    inputKeyRef.placeholder =
                      getCustomKey() !== ""
                        ? hideKey(getCustomKey())
                        : "API 密钥（测试用）";
                  }}
                  h-10
                  px-4
                  py-2
                  bg-slate-5
                  bg-op-15
                  hover:bg-slate-4
                  transition-colors
                  text-slate
                  hover:text-slate-1
                  rounded-r>
                  <IconClear />
                </button>
              </div>
            </div>

            <div class="setting mt-3 ml-1">
              <Setting setting={setting} setSetting={setSetting} />
            </div>
          </div>
          <About />
        </details>
      </li>
    </ul>
  );
  const renderMessageWrapper = () => (
    <div flex-grow-2 classList={{ "mb-17.4": messageList().length > 0 }}>
      <Index each={messageList()}>
        {(message, index) => (
          <MessageItem
            role={message().role}
            message={message().content}
            loading={loading}
            showRetry={() =>
              message().role === "assistant" &&
              index === messageList().length - 1
            }
            onRetry={retryLastFetch}
            onDelete={() => handleDeleteMsg(index)}
          />
        )}
      </Index>
      {currentAssistantMessage() && (
        <MessageItem
          rounded-10
          role="assistant"
          message={currentAssistantMessage}
          loading={loading}
        />
      )}
    </div>
  );
  const renderInputWrapper = () => (
    <div class="flex items-end">
      <textarea
        ref={inputRef!}
        id="input"
        placeholder="说点什么……"
        rows="1"
        resize-none
        autocomplete="off"
        autofocus
        disabled={loading()}
        onKeyDown={handleKeydown}
        onInput={() => {
          inputRef.style.height = "auto";
          inputRef.style.height = inputRef.scrollHeight + "px";
        }}
        w-full
        px-4
        py-3
        min-h-12
        max-h-36
        text-slate-700
        rounded-l
        bg-slate
        class="ipt"
        bg-op-15
        focus:bg-op-20
        focus:ring-0
        focus:outline-none
        placeholder:text-slate-900
        placeholder:op-30
      />
      <button
        title="发送"
        onClick={handleButtonClick}
        disabled={loading()}
        h-12
        px-4
        py-2
        bg-slate-5
        bg-op-15
        hover:bg-slate-4
        transition-colors
        rounded-r
        text-slate>
        <IconSend />
      </button>
    </div>
  );

  return (
    <div class="my-6 flex flex-col">
      <p class="text-pink-600 text-sm mb-1">
        是一个暖心小天使，有时会<strong>摸摸你的头</strong>╰(￣ω￣ｏ)
      </p>
      <p class="text-pink-600 text-sm mb-1">
        这里是部分功能的在线体验，完整版请到我的展位 <strong>AI工程实践 02-16（AH-02-00192）</strong> 看看，也请大大<strong>为我投一票</strong>！
      </p>
      {renderAdvancedSettings()}
      {renderMessageWrapper()}
      <div
        classList={{
          "fixed bottom-0 z-1 pr-8 pb-4 w-full bg-[#f5e6d8]":
            messageList().length > 0,
        }}
        style="max-width: 75ch">
        <Show
          when={!loading()}
          fallback={() => (
            <div class="flex">
              <button class="h-12 bg-[#80a39d] rounded-l text-white font-medium px-4 py-2 hover:bg-primary/80 w-full">
                <LoadingDots style="large" />
              </button>
              <button
                title="停止"
                h-12
                px-4
                py-2
                bg-slate
                bg-op-15
                items-center
                hover:bg-slate-500
                transition-colors
                text-slate
                hover:text-slate-1
                rounded-r
                onClick={stopStreamFetch}>
                <IconStop />
              </button>
            </div>
          )}>
          {renderInputWrapper()}
          {error() !== "" && <TextError info={error()} />}
        </Show>
        <BottomTool
          loading={loading}
          onClear={clear}
          onRandom={handleRandomPrompt}
        />
        <Footer />
      </div>
    </div>
  );
};
