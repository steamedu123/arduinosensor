/*
   @타이틀 : PMS7003 미세먼지 측정기
*/

#include <C202_Steam_Air_PMS7003_Dust.h>    // 내부 라이브러리 헤더파일

SteamPMS7003 pms7003(3, 2);   // 인스턴스, RX/TX핀 번호를 입력한다.

void setup() {
  Serial.begin(9600);     // 96000bps의 속도로 시리얼 통신을 시작한다.
  pms7003.begin();        // (1) 센서를 초기화 한다.
}

void loop() {
  if (pms7003.read()) {   // (2) 센서의 값을 측정한다.
    pms7003.display();    // (3) 센서의 값을 출력한다.
  }
}
