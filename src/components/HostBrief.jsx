import React, { useEffect, useState } from 'react';
import { listTables } from '../data/tableRepository.js';

// What a host is agreeing to, before they agree to it.
//
// The traveller taking a seat now gets three plain sentences about how this
// works. The host — who is the harder half of the pilot to recruit, and who
// is the one committing an evening to strangers — got nothing. They were
// asked to name a dish, a time and a place for people they have never met,
// with no statement anywhere of who turns up, who pays, or what the app will
// do for them if the plan changes.
//
// Korean first, because on this screen the reader is the host: the masthead
// already reads 상 차리기 and the button 테이블 열기, so the language follows
// the screen rather than introducing a second convention.
//
// The third item is a weakness and it leads anyway. A host who finds out
// after committing that the app cannot tell their guests the plan changed
// has been misled by omission, and finding out here costs us a table while
// finding out later costs somebody a wasted evening in a city they do not
// live in. Every line below is checked against what the code actually does:
// the join form collects a name and a country, no screen in the app moves
// money, and the cancel dialog already apologises for the same silence.
const POINTS = [
  {
    kr: '누가 오나요',
    en: 'Who turns up',
    ko: '여행자가 이름과 나라만 남기고 자리를 요청합니다. 승인 절차는 아직 없습니다.',
    body: 'A traveller asks for a seat with a name and a country. There is no approval step yet.',
  },
  {
    kr: '밥값은',
    en: 'The bill',
    ko: '밥친구는 돈을 다루지 않습니다. 각자 먹은 만큼 식당에서 냅니다.',
    body: 'No money moves through this app. Everyone pays for what they eat, at the restaurant.',
  },
  {
    kr: '연락은',
    en: 'Staying in touch',
    ko: '아직 앱 안에서 대화할 수 없습니다. 약속이 바뀌거나 취소해도 참가자에게 알림이 가지 않습니다.',
    body: 'There is no messaging yet. If the plan changes or you call it off, the app cannot tell them.',
  },
];

export default function HostBrief({ profile }) {
  // Only for somebody who has never set a table. A host on their second one
  // has already learned all of this the direct way.
  const [firstTime, setFirstTime] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const tables = await listTables();
      const hosted = tables.some(t => t.hostId && t.hostId === profile?.userId);
      if (alive) setFirstTime(!hosted);
    })();
    return () => { alive = false; };
  }, [profile]);

  if (!firstTime) return null;

  return (
    <section className="host-brief" aria-label="Before you set a table">
      <p className="host-brief__kr">밥상을 열기 전에</p>
      <h2 className="host-brief__title">Before you set a table</h2>

      <dl className="host-brief__list">
        {POINTS.map(p => (
          <div key={p.kr} className="host-brief__item">
            <dt className="host-brief__term">
              <span className="host-brief__term-kr">{p.kr}</span>
              <span className="host-brief__term-en">{p.en}</span>
            </dt>
            <dd className="host-brief__def">
              <span className="host-brief__ko">{p.ko}</span>
              <span className="host-brief__en">{p.body}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
