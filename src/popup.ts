import { isRefExists } from './apiClient';
import { getIdsFromSessionCode } from './apiClient';

window.onload = () => {
  // 로컬 스토리지에서 'fragment' 키의 값을 가져와서 초기 화면을 결정
  chrome.storage.local.get(['fragment']).then((result) => {

    const main = document.querySelector('#body') as Element;

    // 'fragment' 값에 따라 다른 화면을 렌더링
    if (result.fragment == 'start') {
      toStart(main);
    } else if (result.fragment == 'quit') {
      toQuit(main);
    } else if (result.fragment == 'InputInfo') {
      toInputInfo(main)
    } else if (main !== undefined) {
      // 기본 로그인 화면을 렌더링
      main.innerHTML = getUserLoginElement();
      const submit = document.querySelector('#submit');

      // 'submit' 버튼 클릭 이벤트 핸들러
      submit?.addEventListener('click', async () => {

        const sessionCode = (document.getElementById('session-code') as HTMLInputElement).value.trim();

        if (!sessionCode) {
          alert('Please enter a Session Code.');
          return;
        }

        try {
          // Firestore에서 세션코드로 데이터 조회
          const ids = await getIdsFromSessionCode(sessionCode);

          if (!ids) {
            alert('Invalid Session Code. Please check and try again.');
            return;
          }

          console.log('Project ID:', ids.projectId);
          console.log('Task Suite ID:', ids.taskSuiteId);
          console.log('Task ID:', ids.taskId);

          // 입력된 ID들이 유효한지 확인
          const isRefExist = await isRefExists(ids.projectId, ids.taskSuiteId, ids.taskId);

          if (isRefExist) {
            // 유효한 ID라면 로컬 스토리지에 저장하고 다음 화면으로 이동
            await setIDsInLocal(ids.projectId, ids.taskSuiteId, ids.taskId, () =>
              toInputInfo(main)
            );
          } else {
            //alert('올바른 ID를 입력하세요. ID는 관리자에게 발급받을 수 있습니다.');
            alert('Invalid Session Code.');
          }
        } catch (error) {
          console.error('Error processing Session Code:', error);
          alert('An error occurred while processing the Session Code.');
        }
      });
    }
  });

  // 저장된 isPaused 상태에 따라 버튼 텍스트 설정
  chrome.storage.local.get(['isPaused'], (result: { isPaused?: boolean }) => {
    const isPaused = result.isPaused ?? false;
    updatePauseButtonText(isPaused);
  });
};

/**
 * 로컬 스토리지에 ID들을 저장하는 함수
 * @param {string} projId - 프로젝트 ID
 * @param {string} taskSuiteId - Task Suite ID
 * @param {string} taskId - 태스크 ID
 * @param {() => void} callback - 콜백 함수
 */
const setIDsInLocal = async (
  projId: string,
  taskSuiteId: string,
  taskId: string,
  callback: () => void
) => {
  await chrome.storage.local.set(
    {
      projectId: projId,
      taskSuiteId: taskSuiteId,
      taskId: taskId,
      fragment: 'InputInfo',
    },
    callback
  );
};

/**
 * 로컬 스토리지에 사용자 정보를 저장하는 함수
 * @param {string} userId - 사용자 ID
 * @param {number} userAge - 사용자 나이
 * @param {string} userGender - 사용자 성별
 * @param {string} userCountry - 사용자 국가
 * @param {() => void} callback - 콜백 함수
 */
const setUserInfoInLocal = async (
  userId: string,
  userAge: number,
  userGender: string,
  userCountry: string,
  callback: () => void
) => {
  await chrome.storage.local.set(
    {
      userId: userId,
      userAge: userAge,
      userGender: userGender,
      userCountry: userCountry,
      fragment: 'start',
    },
    callback
  );
};

/**
 * 사용자 정보를 입력받는 화면으로 이동하는 함수
 * @param {Element} main - 메인 엘리먼트
 */
const toInputInfo = (main: Element) => {
  main.innerHTML = getUserInfoElement(); //html조각 끼우기
  const submit = document.querySelector('#InfoSubmit');
  submit?.addEventListener('click', async () => {
    // info input page
    const userIdInput = document.querySelector(
      '#user-id'
    ) as HTMLInputElement;
    const ageInput = document.querySelector(
      '#Age-id'
    ) as HTMLInputElement;
    const genderInput = document.querySelector(
      '#Gender-id'
    ) as HTMLInputElement;
    const countryInput = document.querySelector(
      '#Country-id'
    ) as HTMLInputElement;
    const userId = userIdInput.value;
    const age = ageInput.value;
    const gender = genderInput.value;
    const country = countryInput.value;

    // 입력 값들이 모두 작성됐는지 확인
    if (userId && age && gender && country) {
      // 모든 입력란이 작성되었다면, 로컬 스토리지에 저장하고 다음 화면으로 이동
      await setUserInfoInLocal(
        userIdInput.value,
        +ageInput.value,  //숫자로 강제 변환하는 기호 +붙이기
        genderInput.value,
        countryInput.value,
        () => toStart(main)
      )
    } else {
      alert(
        'Please enter all information accurately.'
      );
    }
  })
}
const toLogin = (main: Element) => {

}

/**
 * 테스트 시작 화면으로 이동하는 함수
 * @param {Element} main - 메인 엘리먼트
 */
const toStart = (main: Element) => {
  main.innerHTML = toStartElement();
  const btn = document.querySelector('#start');
  btn?.addEventListener('click', function (event) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id !== undefined)
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startSession' });
      toQuit(main);
    });
  });
};

/**
 * 테스트 종료를 위한 화면(Finish 버튼을 누를 수 있는 페이지)으로 이동하는 함수
 * @param {Element} main - 메인 엘리먼트
 */
const toQuit = (main: Element) => {
  main.innerHTML = toQuitElement();
  const quit = document.querySelector('#quit');
  const pause = document.querySelector('#pause');
  const giveup = document.querySelector('#giveup');
  const finish = document.querySelector('#finish');
  chrome.storage.local.set({ fragment: 'quit' });

  // giveup and save
  giveup?.addEventListener('click', function (event) {
    chrome.storage.local.set({ isPaused: false, finish: false, fragment: 'end' }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id !== undefined)
          chrome.tabs.sendMessage(tabs[0].id, { action: 'quitSession', isSave: 'true' });
        toEnd(main);
      });
      toEnd(main);
    });
  });

  // Pause or Resume 버튼 이벤트 리스너
  pause?.addEventListener('click', function (event) {
    chrome.storage.local.get(['isPaused'], function (result) {
      let isPaused = result.isPaused ?? false; // 기본값 false 설정

      // 새로운 상태 결정
      isPaused = !isPaused;

      // 새로운 상태 저장 및 UI 업데이트
      chrome.storage.local.set({ isPaused: isPaused }, function () {
        //정지버튼 텍스트 변경 ex) Pause -> Resume
        updatePauseButtonText(isPaused);

        //action 상태 변경
        const action = isPaused ? 'pauseSession' : 'resumeSession';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id !== undefined) {
            chrome.tabs.sendMessage(tabs[0].id, { action: action });
          }
        });
      });
    });
  });

  // quit and not save
  quit?.addEventListener('click', function (event) {
    chrome.storage.local.set({ isPaused: false, finish: false, fragment: 'end' }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id !== undefined)
          chrome.tabs.sendMessage(tabs[0].id, { action: 'quitSession', isSave: 'false' });
        toEnd(main);
      });
      toEnd(main);
    });
  });

  // Finish
  finish?.addEventListener('click', function (event) {
    chrome.storage.local.set({ isPaused: false, finish: true, fragment: 'end' }, function () {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id !== undefined)
          chrome.tabs.sendMessage(tabs[0].id, { action: 'finishSession' });
        toEnd(main);
      });
      toEnd(main);
    });
  });
};

/**
 * Pause 버튼 텍스트 업데이트 함수
 * @param {boolean} isPaused - Pause 상태 여부
 */
function updatePauseButtonText(isPaused: boolean): void {
  const pauseButton = document.getElementById('pause');
  if (!pauseButton) return; // 버튼이 없으면 함수 종료
  if (isPaused) {
    pauseButton.textContent = 'Resume';
    pauseButton.style.backgroundColor = 'green'
  } else {
    pauseButton.textContent = 'Pause';
    pauseButton.style.backgroundColor = 'orange'
  }
}

/**
 * 테스트 종료 화면으로 이동하는 함수
 * @param {Element} main - 메인 엘리먼트
 */
const toEnd = (main: Element) => {
  main.innerHTML = getEndElement();
};

/**
 * 사용자 정보 입력 폼 HTML을 반환하는 함수
 * @returns {string} - 사용자 정보 입력 폼 HTML
 */
const getUserInfoElement = () => {
  return `
  <form>
  <div style="margin-bottom: 20px;">
    <h6 style="color: blue;">Welcome</h6>
    <h5 class="card-title" style="font-weight: bold;">Please enter the correct test in-formation.</h5>
  </div>
  <div class="inputbox form-group">
    <label for="user-id" style="margin-bottom: 0;">User ID</label>
    <input type="text" class="form-control" id="user-id" placeholder="Enter user ID">
  </div>
  <div class="inputbox form-group">
    <label for="Age-id" style="margin-bottom: 0;">Age</label>
    <input type="text" class="form-control" id="Age-id" placeholder="Enter your AGE">
  </div>
  <div class="inputbox form-group">
    <label for="Gender-id" style="margin-bottom: 0;">Gender</label>
    <input type="text" class="form-control" id="Gender-id" placeholder="Enter your GENDER">
  </div>
  <div class="inputbox form-group">
    <label for="Country-id" style="margin-bottom: 0;">Country</label>
    <input type="text" class="form-control" id="Country-id" placeholder="Enter your COUNTRY">
  </div>
  <button id="InfoSubmit" type="button" class="btn btn-primary">Submit</button>
</form>

`;
};

/**
 * 사용자 로그인 폼 HTML을 반환하는 함수
 * @returns {string} - 사용자 로그인 폼 HTML
 */
const getUserLoginElement = () => {
  return `
  <div style="margin-bottom: 20px;">
    <h5 style="color: blue;">Welcome</h5>
    <h5 class="card-title" style="font-weight: bold;">Before the test, please enter the Session Code.</h5>
  </div>
  <form>
    <div class="inputbox form-group">
      <label for="session-code" style="margin-bottom: 0;">Session Code</label>
      <input type="text" class="form-control" id="session-code" placeholder="Enter Session Code">
    </div>
    <button id="submit" type="button" class="btn btn-primary">Submit</button>
  </form>
  `;
};

/**
 * 테스트 시작 화면 HTML을 반환하는 함수
 * @returns {string} - 테스트 시작 화면 HTML
 */
const toStartElement = () => {
  return `
  <h6 class="card-title" style="color: blue;">The test will now begin.</h6>
  <h5 class="card-title" style="font-weight: bold;">Before you begin the test:</h5>
  <p class="card-text">•Do you fully understand the task and reference 
  materials?</p>
  <p class="card-text">•Is your environment ready for the test? (inter-
    net, computer, etc.)</p>
  <button id="start" class="btn btn-primary">Click to Start</button>
  `;
};

/**
 * 테스트 종료를 위한 화면 HTML을 반환하는 함수
 * @returns {string} - 테스트 종료 화면 HTML
 */
const toQuitElement = () => {
  return `

  <h6 class="card-text" style="color: blue;">Testing in Progress...</h6>
  <h5 class="card-title" style="font-weight: bold;">Are you sure you want to quit the usability test?</h5>

  <p class="card-text" style="margin-bottom: 0;">Pause the test</p>
  <p><button id="pause" class="btn btn-primary" style="width: 100%; background-color: orange; border: none;">Pause</button></p>

  <p class="card-text pt-4" style="margin-bottom: 0;">Finish the test</p>
  <p><button id="finish" class="btn btn-primary" style="width: 100%;">Finish</button></p>

  <p class="card-text" style="margin-bottom: 0;">Give up the test</p>
  <p><button id="giveup" class="btn btn-primary" style="width: 100%; margin-bottom: 0;"">Give Up</button></p>

  <p class="card-text" style="margin-bottom: 0; font-size: 16px;">Quit: <span style="color: red;">Progress will be lost</span></p>
  <p><button id="quit" class="btn btn-primary" style="width: 100%;">Quit</button></p>
  `;
};

/**
 * 테스트 종료 후 메시지를 표시하는 HTML을 반환하는 함수
 * @returns {string} - 종료 메시지 HTML
 */
const getEndElement = () => {
  return `
  <h5 class="card-title">Thank you for participating.</h5>
  `;
};