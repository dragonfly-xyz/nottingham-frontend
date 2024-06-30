import{s as Ye,o as ye,b as V,p as $,j as M,k as S,i as _,L as We,I as qe,e as w,d as g,q as x,v as j,t as T,f as A,h as D,l as d,m as J,n as se,x as le,w as Ae,A as he,r as $e,M as Te}from"../chunks/scheduler.C1FoT2GD.js";import{S as Xe,i as Qe,c as je,b as Ce,m as Ee,t as ue,a as fe,d as Pe,g as Ze,e as xe}from"../chunks/index.DFmxPlw4.js";import{e as re,u as Se,d as Ie}from"../chunks/each.Bmx-BImQ.js";import{P as et,L as tt,C as lt}from"../chunks/page.CWCv2ozC.js";import{p as st}from"../chunks/stores.ZuLyBo9H.js";import{v as ge,w as ke,a as nt,r as at,P as rt,U as ee,c as we,k as it,g as _e,j as pe,f as me}from"../chunks/kit.B5hTzwHX.js";import{b as ve}from"../chunks/paths.DOnYZ1f4.js";import{m as De,w as ot,a as ct,b as ut,S as ft}from"../chunks/contest.BdJ2gSqk.js";import{z as dt}from"../chunks/bytes.BO06K83n.js";async function ht(r,e,t){const l=Buffer.concat([ge(e),ge(t)]),s=await crypto.subtle.generateKey({name:"AES-GCM",length:128},!0,["encrypt","decrypt"]),n=crypto.getRandomValues(new Uint8Array(12)),a=await crypto.subtle.encrypt({name:"AES-GCM",iv:n},s,l),i=await crypto.subtle.encrypt({name:"RSA-OAEP"},await crypto.subtle.importKey("jwk",_t(r),{name:"RSA-OAEP",hash:"SHA-256"},!1,["encrypt"]),await crypto.subtle.exportKey("raw",s));return{encryptedAesKey:ke(new Uint8Array(i)),encryptedCode:ke(new Uint8Array(a).slice(0,-16)),iv:ke(n)}}function _t(r){return JSON.parse(Buffer.from(ge(r)).toString())}function Ne(r,e,t){const l=r.slice();return l[38]=e[t],l[40]=t,l}function He(r,e,t){const l=r.slice();return l[41]=e[t],l}function Oe(r,e,t){const l=r.slice();return l[41]=e[t],l}function Ve(r){let e,t,l,s,n,a,i=r[0].playerAddress+"",p,C,h,m;function I(c,k){return c[12]?mt:pt}let b=I(r),v=b(r);function y(c,k){return c[9]?bt:vt}let o=y(r),f=o(r);return{c(){e=w("div"),t=T(`Name:
            `),v.c(),l=V(),s=w("div"),n=T("Address: "),a=w("a"),p=T(i),h=V(),m=w("div"),f.c(),this.h()},l(c){e=g(c,"DIV",{});var k=A(e);t=D(k,`Name:
            `),v.l(k),k.forEach(_),l=M(c),s=g(c,"DIV",{class:!0});var O=A(s);n=D(O,"Address: "),a=g(O,"A",{class:!0,href:!0,target:!0});var N=A(a);p=D(N,i),N.forEach(_),O.forEach(_),h=M(c),m=g(c,"DIV",{class:!0});var L=A(m);f.l(L),L.forEach(_),this.h()},h(){var c,k,O;j(a,"class","address svelte-1j7wjax"),j(a,"href",C=`${(O=(k=(c=r[15])==null?void 0:c.chain)==null?void 0:k.blockExplorers)==null?void 0:O.default.url}address/${r[0].playerAddress}`),j(a,"target","_blank"),j(s,"class","address svelte-1j7wjax"),j(m,"class","is-active")},m(c,k){S(c,e,k),d(e,t),v.m(e,null),S(c,l,k),S(c,s,k),d(s,n),d(s,a),d(a,p),S(c,h,k),S(c,m,k),f.m(m,null)},p(c,k){var O,N,L;b===(b=I(c))&&v?v.p(c,k):(v.d(1),v=b(c),v&&(v.c(),v.m(e,null))),k[0]&1&&i!==(i=c[0].playerAddress+"")&&J(p,i),k[0]&1&&C!==(C=`${(L=(N=(O=c[15])==null?void 0:O.chain)==null?void 0:N.blockExplorers)==null?void 0:L.default.url}address/${c[0].playerAddress}`)&&j(a,"href",C),o!==(o=y(c))&&(f.d(1),f=o(c),f&&(f.c(),f.m(m,null)))},d(c){c&&(_(e),_(l),_(s),_(h),_(m)),v.d(),f.d()}}}function pt(r){let e,t=r[0].playerName+"",l;return{c(){e=w("span"),l=T(t),this.h()},l(s){e=g(s,"SPAN",{class:!0});var n=A(e);l=D(n,t),n.forEach(_),this.h()},h(){j(e,"class","name svelte-1j7wjax")},m(s,n){S(s,e,n),d(e,l)},p(s,n){n[0]&1&&t!==(t=s[0].playerName+"")&&J(l,t)},d(s){s&&_(e)}}}function mt(r){let e,t=r[0].playerName+"",l;return{c(){e=w("a"),l=T(t),this.h()},l(s){e=g(s,"A",{class:!0,target:!0,href:!0});var n=A(e);l=D(n,t),n.forEach(_),this.h()},h(){j(e,"class","name svelte-1j7wjax"),j(e,"target","_blank"),j(e,"href",r[12])},m(s,n){S(s,e,n),d(e,l)},p(s,n){n[0]&1&&t!==(t=s[0].playerName+"")&&J(l,t),n[0]&4096&&j(e,"href",s[12])},d(s){s&&_(e)}}}function vt(r){let e;return{c(){e=T("Awaiting submission ✘")},l(t){e=D(t,"Awaiting submission ✘")},m(t,l){S(t,e,l)},d(t){t&&_(e)}}}function bt(r){let e;return{c(){e=T("Submission received ✓")},l(t){e=D(t,"Submission received ✓")},m(t,l){S(t,e,l)},d(t){t&&_(e)}}}function yt(r){let e,t="Merchant Details",l,s,n=r[0]&&Ve(r);return{c(){e=w("h1"),e.textContent=t,l=V(),n&&n.c(),s=$(),this.h()},l(a){e=g(a,"H1",{class:!0,"data-svelte-h":!0}),x(e)!=="svelte-1g3lfz6"&&(e.textContent=t),l=M(a),n&&n.l(a),s=$(),this.h()},h(){j(e,"class","svelte-1j7wjax")},m(a,i){S(a,e,i),S(a,l,i),n&&n.m(a,i),S(a,s,i)},p(a,i){a[0]?n?n.p(a,i):(n=Ve(a),n.c(),n.m(s.parentNode,s)):n&&(n.d(1),n=null)},d(a){a&&(_(e),_(l),_(s)),n&&n.d(a)}}}function kt(r){var y;let e,t,l,s="Performance History",n,a,i,p=r[11]>0n&&((y=r[3])==null?void 0:y.address)==r[0].playerAddress&&Me(r);function C(o,f){var c;return(c=o[0].seasonResults)!=null&&c.length?Et:Pt}let h=C(r),m=h(r);function I(o,f){if(!o[1]||o[1].state!==ft.Started||o[1].isTerminal)return It;if(o[8])return St}let b=I(r),v=b&&b(r);return{c(){e=w("section"),p&&p.c(),t=V(),l=w("h2"),l.textContent=s,n=V(),m.c(),a=V(),i=w("section"),v&&v.c(),this.h()},l(o){e=g(o,"SECTION",{class:!0});var f=A(e);p&&p.l(f),t=M(f),l=g(f,"H2",{class:!0,"data-svelte-h":!0}),x(l)!=="svelte-9rlwd4"&&(l.textContent=s),n=M(f),m.l(f),f.forEach(_),a=M(o),i=g(o,"SECTION",{class:!0});var c=A(i);v&&v.l(c),c.forEach(_),this.h()},h(){j(l,"class","svelte-1j7wjax"),j(e,"class","stats svelte-1j7wjax"),j(i,"class","tools svelte-1j7wjax")},m(o,f){S(o,e,f),p&&p.m(e,null),d(e,t),d(e,l),d(e,n),m.m(e,null),S(o,a,f),S(o,i,f),v&&v.m(i,null)},p(o,f){var c;o[11]>0n&&((c=o[3])==null?void 0:c.address)==o[0].playerAddress?p?p.p(o,f):(p=Me(o),p.c(),p.m(e,t)):p&&(p.d(1),p=null),h===(h=C(o))&&m?m.p(o,f):(m.d(1),m=h(o),m&&(m.c(),m.m(e,null))),b===(b=I(o))&&v?v.p(o,f):(v&&v.d(1),v=b&&b(o),v&&(v.c(),v.m(i,null)))},i:se,o:se,d(o){o&&(_(e),_(a),_(i)),p&&p.d(),m.d(),v&&v.d()}}}function wt(r){let e,t,l=_e(r[4])+"",s;return{c(){e=w("section"),t=w("div"),s=T(l),this.h()},l(n){e=g(n,"SECTION",{class:!0});var a=A(e);t=g(a,"DIV",{});var i=A(t);s=D(i,l),i.forEach(_),a.forEach(_),this.h()},h(){j(e,"class","not-found svelte-1j7wjax")},m(n,a){S(n,e,a),d(e,t),d(t,s)},p(n,a){a[0]&16&&l!==(l=_e(n[4])+"")&&J(s,l)},i:se,o:se,d(n){n&&_(e)}}}function gt(r){let e,t,l;return t=new lt({}),{c(){e=w("section"),je(t.$$.fragment),this.h()},l(s){e=g(s,"SECTION",{class:!0});var n=A(e);Ce(t.$$.fragment,n),n.forEach(_),this.h()},h(){j(e,"class","loading svelte-1j7wjax")},m(s,n){S(s,e,n),Ee(t,e,null),l=!0},p:se,i(s){l||(ue(t.$$.fragment,s),l=!0)},o(s){fe(t.$$.fragment,s),l=!1},d(s){s&&_(e),Pe(t)}}}function Me(r){let e;function t(n,a){return n[10]?Ct:jt}let l=t(r),s=l(r);return{c(){e=w("div"),s.c(),this.h()},l(n){e=g(n,"DIV",{class:!0});var a=A(e);s.l(a),a.forEach(_),this.h()},h(){j(e,"class","alert svelte-1j7wjax")},m(n,a){S(n,e,a),s.m(e,null)},p(n,a){l===(l=t(n))&&s?s.p(n,a):(s.d(1),s=l(n),s&&(s.c(),s.m(e,null)))},d(n){n&&_(e),s.d()}}}function jt(r){let e,t,l=pe(r[11])+"",s,n;return{c(){e=w("p"),t=T("You have "),s=T(l),n=T(' ETH in unclaimed prizes! Look for an email from a "@dragonfly.xyz" address in the next few days with further instructions on how to claim.')},l(a){e=g(a,"P",{});var i=A(e);t=D(i,"You have "),s=D(i,l),n=D(i,' ETH in unclaimed prizes! Look for an email from a "@dragonfly.xyz" address in the next few days with further instructions on how to claim.'),i.forEach(_)},m(a,i){S(a,e,i),d(e,t),d(e,s),d(e,n)},p(a,i){i[0]&2048&&l!==(l=pe(a[11])+"")&&J(s,l)},d(a){a&&_(e)}}}function Ct(r){let e,t,l=pe(r[11])+"",s,n,a,i,p,C,h,m;return{c(){e=w("p"),t=T("You have "),s=T(l),n=T(` ETH in unclaimed prizes!
                `),a=w("button"),i=T("Claim Prize"),this.h()},l(I){e=g(I,"P",{});var b=A(e);t=D(b,"You have "),s=D(b,l),n=D(b,` ETH in unclaimed prizes!
                `),a=g(b,"BUTTON",{"aria-busy":!0,class:!0});var v=A(a);i=D(v,"Claim Prize"),v.forEach(_),b.forEach(_),this.h()},h(){a.disabled=p=r[6]instanceof Promise,j(a,"aria-busy",C=r[6]instanceof Promise),j(a,"class","svelte-1j7wjax")},m(I,b){S(I,e,b),d(e,t),d(e,s),d(e,n),d(e,a),d(a,i),h||(m=le(a,"click",r[24]),h=!0)},p(I,b){b[0]&2048&&l!==(l=pe(I[11])+"")&&J(s,l),b[0]&64&&p!==(p=I[6]instanceof Promise)&&(a.disabled=p),b[0]&64&&C!==(C=I[6]instanceof Promise)&&j(a,"aria-busy",C)},d(I){I&&_(e),h=!1,m()}}}function Et(r){let e=[],t=new Map,l,s=re(r[0].seasonResults);const n=a=>a[40];for(let a=0;a<s.length;a+=1){let i=Ne(r,s,a),p=n(i);t.set(p,e[a]=Ue(p,i))}return{c(){for(let a=0;a<e.length;a+=1)e[a].c();l=$()},l(a){for(let i=0;i<e.length;i+=1)e[i].l(a);l=$()},m(a,i){for(let p=0;p<e.length;p+=1)e[p]&&e[p].m(a,i);S(a,l,i)},p(a,i){i[0]&5&&(s=re(a[0].seasonResults),e=Se(e,i,n,1,a,s,t,l.parentNode,Ie,Ue,l,Ne))},d(a){a&&_(l);for(let i=0;i<e.length;i+=1)e[i].d(a)}}}function Pt(r){let e,t="<em>This player has not competed in any games.</em>";return{c(){e=w("p"),e.innerHTML=t,this.h()},l(l){e=g(l,"P",{class:!0,"data-svelte-h":!0}),x(e)!=="svelte-5dtyj2"&&(e.innerHTML=t),this.h()},h(){j(e,"class","svelte-1j7wjax")},m(l,s){S(l,e,s)},p:se,d(l){l&&_(e)}}}function Le(r){let e,t,l,s=r[0].seasonResults.length-r[40]+"",n,a,i,p="<div>Date</div> <div>Type</div> <div>Rank</div> <div>Score</div>",C,h=[],m=new Map,I,b,v=re(r[38].slice(0,10));const y=f=>f[41].tournamentId;for(let f=0;f<v.length;f+=1){let c=Oe(r,v,f),k=y(c);m.set(k,h[f]=ze(k,c))}let o=r[38].length>10&&Re(r);return{c(){e=w("div"),t=w("h3"),l=T("Season "),n=T(s),a=V(),i=w("div"),i.innerHTML=p,C=V();for(let f=0;f<h.length;f+=1)h[f].c();I=V(),o&&o.c(),b=V(),this.h()},l(f){e=g(f,"DIV",{class:!0});var c=A(e);t=g(c,"H3",{class:!0});var k=A(t);l=D(k,"Season "),n=D(k,s),k.forEach(_),a=M(c),i=g(c,"DIV",{class:!0,"data-svelte-h":!0}),x(i)!=="svelte-1cc9pll"&&(i.innerHTML=p),C=M(c);for(let O=0;O<h.length;O+=1)h[O].l(c);I=M(c),o&&o.l(c),b=M(c),c.forEach(_),this.h()},h(){j(t,"class","svelte-1j7wjax"),j(i,"class","tournament-result header svelte-1j7wjax"),j(e,"class","season svelte-1j7wjax"),Te(e,"expanded",r[2][r[40]])},m(f,c){S(f,e,c),d(e,t),d(t,l),d(t,n),d(e,a),d(e,i),d(e,C);for(let k=0;k<h.length;k+=1)h[k]&&h[k].m(e,null);d(e,I),o&&o.m(e,null),d(e,b)},p(f,c){c[0]&1&&s!==(s=f[0].seasonResults.length-f[40]+"")&&J(n,s),c[0]&1&&(v=re(f[38].slice(0,10)),h=Se(h,c,y,1,f,v,m,e,Ie,ze,I,Oe)),f[38].length>10?o?o.p(f,c):(o=Re(f),o.c(),o.m(e,b)):o&&(o.d(1),o=null),c[0]&5&&Te(e,"expanded",f[2][f[40]])},d(f){f&&_(e);for(let c=0;c<h.length;c+=1)h[c].d();o&&o.d()}}}function ze(r,e){let t,l,s,n=e[41].time.toLocaleDateString()+"",a,i,p,C,h=e[41].type==="scrimmage"?"Market Day":"Grand Faire",m,I,b,v=e[41].rank+1+"",y,o,f=e[41].totalPlayers+"",c,k,O,N=me(e[41].score)+"",L;return{key:r,first:null,c(){t=w("div"),l=w("div"),s=w("a"),a=T(n),p=V(),C=w("div"),m=T(h),I=V(),b=w("div"),y=T(v),o=T(" / "),c=T(f),k=V(),O=w("div"),L=T(N),this.h()},l(F){t=g(F,"DIV",{class:!0});var E=A(t);l=g(E,"DIV",{});var z=A(l);s=g(z,"A",{href:!0,class:!0});var X=A(s);a=D(X,n),X.forEach(_),z.forEach(_),p=M(E),C=g(E,"DIV",{});var G=A(C);m=D(G,h),G.forEach(_),I=M(E),b=g(E,"DIV",{});var W=A(b);y=D(W,v),o=D(W," / "),c=D(W,f),W.forEach(_),k=M(E),O=g(E,"DIV",{});var q=A(O);L=D(q,N),q.forEach(_),E.forEach(_),this.h()},h(){j(s,"href",i=`${ve}/tournament?season=${e[41].season+1}&id=${e[41].tournamentId}`),j(s,"class","svelte-1j7wjax"),j(t,"class","tournament-result svelte-1j7wjax"),this.first=t},m(F,E){S(F,t,E),d(t,l),d(l,s),d(s,a),d(t,p),d(t,C),d(C,m),d(t,I),d(t,b),d(b,y),d(b,o),d(b,c),d(t,k),d(t,O),d(O,L)},p(F,E){e=F,E[0]&1&&n!==(n=e[41].time.toLocaleDateString()+"")&&J(a,n),E[0]&1&&i!==(i=`${ve}/tournament?season=${e[41].season+1}&id=${e[41].tournamentId}`)&&j(s,"href",i),E[0]&1&&h!==(h=e[41].type==="scrimmage"?"Market Day":"Grand Faire")&&J(m,h),E[0]&1&&v!==(v=e[41].rank+1+"")&&J(y,v),E[0]&1&&f!==(f=e[41].totalPlayers+"")&&J(c,f),E[0]&1&&N!==(N=me(e[41].score)+"")&&J(L,N)},d(F){F&&_(t)}}}function Re(r){let e,t,l=r[38].length-10+"",s,n,a,i=[],p=new Map,C,h,m;function I(){return r[25](r[40])}let b=re(r[38].slice(10));const v=y=>y[41].tournamentId;for(let y=0;y<b.length;y+=1){let o=He(r,b,y),f=v(o);p.set(f,i[y]=Be(f,o))}return{c(){e=w("button"),t=T("[+] Show "),s=T(l),n=T(" more"),a=V();for(let y=0;y<i.length;y+=1)i[y].c();C=$(),this.h()},l(y){e=g(y,"BUTTON",{class:!0});var o=A(e);t=D(o,"[+] Show "),s=D(o,l),n=D(o," more"),o.forEach(_),a=M(y);for(let f=0;f<i.length;f+=1)i[f].l(y);C=$(),this.h()},h(){j(e,"class","expand custom svelte-1j7wjax")},m(y,o){S(y,e,o),d(e,t),d(e,s),d(e,n),S(y,a,o);for(let f=0;f<i.length;f+=1)i[f]&&i[f].m(y,o);S(y,C,o),h||(m=le(e,"click",I),h=!0)},p(y,o){r=y,o[0]&1&&l!==(l=r[38].length-10+"")&&J(s,l),o[0]&1&&(b=re(r[38].slice(10)),i=Se(i,o,v,1,r,b,p,C.parentNode,Ie,Be,C,He))},d(y){y&&(_(e),_(a),_(C));for(let o=0;o<i.length;o+=1)i[o].d(y);h=!1,m()}}}function Be(r,e){let t,l,s,n=e[41].time.toLocaleDateString()+"",a,i,p,C,h=e[41].type==="scrimmage"?"Market Day":"Grand Faire",m,I,b,v=e[41].rank+1+"",y,o,f=e[41].totalPlayers+"",c,k,O,N=me(e[41].score)+"",L,F;return{key:r,first:null,c(){t=w("div"),l=w("div"),s=w("a"),a=T(n),p=V(),C=w("div"),m=T(h),I=V(),b=w("div"),y=T(v),o=T(" / "),c=T(f),k=V(),O=w("div"),L=T(N),F=V(),this.h()},l(E){t=g(E,"DIV",{class:!0});var z=A(t);l=g(z,"DIV",{});var X=A(l);s=g(X,"A",{href:!0,class:!0});var G=A(s);a=D(G,n),G.forEach(_),X.forEach(_),p=M(z),C=g(z,"DIV",{});var W=A(C);m=D(W,h),W.forEach(_),I=M(z),b=g(z,"DIV",{});var q=A(b);y=D(q,v),o=D(q," / "),c=D(q,f),q.forEach(_),k=M(z),O=g(z,"DIV",{});var te=A(O);L=D(te,N),te.forEach(_),F=M(z),z.forEach(_),this.h()},h(){j(s,"href",i=`${ve}/tournament?season=${e[41].season+1}&id=${e[41].tournamentId}`),j(s,"class","svelte-1j7wjax"),j(t,"class","tournament-result optional svelte-1j7wjax"),this.first=t},m(E,z){S(E,t,z),d(t,l),d(l,s),d(s,a),d(t,p),d(t,C),d(C,m),d(t,I),d(t,b),d(b,y),d(b,o),d(b,c),d(t,k),d(t,O),d(O,L),d(t,F)},p(E,z){e=E,z[0]&1&&n!==(n=e[41].time.toLocaleDateString()+"")&&J(a,n),z[0]&1&&i!==(i=`${ve}/tournament?season=${e[41].season+1}&id=${e[41].tournamentId}`)&&j(s,"href",i),z[0]&1&&h!==(h=e[41].type==="scrimmage"?"Market Day":"Grand Faire")&&J(m,h),z[0]&1&&v!==(v=e[41].rank+1+"")&&J(y,v),z[0]&1&&f!==(f=e[41].totalPlayers+"")&&J(c,f),z[0]&1&&N!==(N=me(e[41].score)+"")&&J(L,N)},d(E){E&&_(t)}}}function Ue(r,e){let t,l,s=e[38].length&&Le(e);return{key:r,first:null,c(){t=$(),s&&s.c(),l=$(),this.h()},l(n){t=$(),s&&s.l(n),l=$(),this.h()},h(){this.first=t},m(n,a){S(n,t,a),s&&s.m(n,a),S(n,l,a)},p(n,a){e=n,e[38].length?s?s.p(e,a):(s=Le(e),s.c(),s.m(l.parentNode,l)):s&&(s.d(1),s=null)},d(n){n&&(_(t),_(l)),s&&s.d(n)}}}function St(r){let e,t,l,s=(r[1].idx??0)+1+"",n,a,i,p,C="Code submissions are posted onchain but remain encrypted until the end of the current season, when the Grand Faire occurs.",h,m,I=`You can either drop your player&#39;s compiled (JSON) artifact file onto the text box below or you can manually paste the hex bytecode yourself.
                If you&#39;re developing in the provided foundry project, you can find can your player artifacts in the <tt>/out</tt> folder under a folder of the same name as your contract file.`,b,v,y="If you&#39;re inputing your code manually, make sure you provide the <em>undeployed</em> bytecode and not the &quot;deployed&quot; one. These are typically named <tt>bytecode</tt> and <tt>deployedBytecode</tt>, respectively, in compiler artifacts.",o,f,c,k,O,N,L,F,E,z="Choose artifact",X,G,W,q,te,ie,oe;function ce(R,u){return R[9]?At:Tt}let ne=ce(r),Q=ne(r);function de(R,u){return typeof R[5]=="string"&&R[5]!=="0x"?Nt:Dt}let ae=de(r),Z=ae(r),K=r[5]instanceof Error&&Fe(r);return{c(){e=w("section"),t=w("h2"),l=T("Submit code for season "),n=T(s),a=V(),Q.c(),i=V(),p=w("p"),p.textContent=C,h=V(),m=w("p"),m.innerHTML=I,b=V(),v=w("p"),v.innerHTML=y,o=V(),f=w("div"),c=w("form"),k=w("textarea"),O=V(),N=w("div"),L=w("input"),F=V(),E=w("button"),E.textContent=z,X=V(),G=w("button"),Z.c(),te=V(),K&&K.c(),this.h()},l(R){e=g(R,"SECTION",{class:!0});var u=A(e);t=g(u,"H2",{class:!0});var H=A(t);l=D(H,"Submit code for season "),n=D(H,s),H.forEach(_),a=M(u),Q.l(u),i=M(u),p=g(u,"P",{"data-svelte-h":!0}),x(p)!=="svelte-10c3xuj"&&(p.textContent=C),h=M(u),m=g(u,"P",{"data-svelte-h":!0}),x(m)!=="svelte-1b18m7p"&&(m.innerHTML=I),b=M(u),v=g(u,"P",{"data-svelte-h":!0}),x(v)!=="svelte-uorx0t"&&(v.innerHTML=y),o=M(u),f=g(u,"DIV",{});var P=A(f);c=g(P,"FORM",{class:!0});var B=A(c);k=g(B,"TEXTAREA",{class:!0,placeholder:!0}),A(k).forEach(_),O=M(B),N=g(B,"DIV",{class:!0});var U=A(N);L=g(U,"INPUT",{type:!0,class:!0}),F=M(U),E=g(U,"BUTTON",{class:!0,"data-svelte-h":!0}),x(E)!=="svelte-1tv6386"&&(E.textContent=z),X=M(U),G=g(U,"BUTTON",{"aria-busy":!0,class:!0});var Y=A(G);Z.l(Y),Y.forEach(_),U.forEach(_),te=M(B),K&&K.l(B),B.forEach(_),P.forEach(_),u.forEach(_),this.h()},h(){j(t,"class","svelte-1j7wjax"),j(k,"class","bytecode svelte-1j7wjax"),j(k,"placeholder","Drop JSON artifact or paste (hex) bytecode"),j(L,"type","file"),j(L,"class","svelte-1j7wjax"),j(E,"class","file svelte-1j7wjax"),j(G,"aria-busy",W=r[5]instanceof Promise),G.disabled=q=!r[7]||r[5]instanceof Promise,j(G,"class","svelte-1j7wjax"),j(N,"class","buttons svelte-1j7wjax"),j(c,"class","submit-bytecode svelte-1j7wjax"),j(e,"class","svelte-1j7wjax")},m(R,u){S(R,e,u),d(e,t),d(t,l),d(t,n),d(e,a),Q.m(e,null),d(e,i),d(e,p),d(e,h),d(e,m),d(e,b),d(e,v),d(e,o),d(e,f),d(f,c),d(c,k),Ae(k,r[7]),d(c,O),d(c,N),d(N,L),r[27](L),d(N,F),d(N,E),d(N,X),d(N,G),Z.m(G,null),d(c,te),K&&K.m(c,null),ie||(oe=[le(k,"drop",he(r[19])),le(k,"dragover",he(r[23])),le(k,"input",r[26]),le(L,"change",r[28]),le(E,"click",he(r[29])),le(c,"submit",he(r[17]))],ie=!0)},p(R,u){u[0]&2&&s!==(s=(R[1].idx??0)+1+"")&&J(n,s),ne!==(ne=ce(R))&&(Q.d(1),Q=ne(R),Q&&(Q.c(),Q.m(e,i))),u[0]&128&&Ae(k,R[7]),ae!==(ae=de(R))&&(Z.d(1),Z=ae(R),Z&&(Z.c(),Z.m(G,null))),u[0]&32&&W!==(W=R[5]instanceof Promise)&&j(G,"aria-busy",W),u[0]&160&&q!==(q=!R[7]||R[5]instanceof Promise)&&(G.disabled=q),R[5]instanceof Error?K?K.p(R,u):(K=Fe(R),K.c(),K.m(c,null)):K&&(K.d(1),K=null)},d(R){R&&_(e),Q.d(),r[27](null),Z.d(),K&&K.d(),ie=!1,$e(oe)}}}function It(r){let e,t="Current season is closed and cannot accept new submissions at this time.";return{c(){e=w("div"),e.textContent=t},l(l){e=g(l,"DIV",{"data-svelte-h":!0}),x(e)!=="svelte-1e9vh8h"&&(e.textContent=t)},m(l,s){S(l,e,s)},p:se,d(l){l&&_(e)}}}function At(r){let e,t="You have already submitted your player code for the current season but you can replace your submission as often as you'd like up until the season close.";return{c(){e=w("p"),e.textContent=t,this.h()},l(l){e=g(l,"P",{class:!0,"data-svelte-h":!0}),x(e)!=="svelte-1m9t20m"&&(e.textContent=t),this.h()},h(){j(e,"class","svelte-1j7wjax")},m(l,s){S(l,e,s)},d(l){l&&_(e)}}}function Tt(r){let e,t="You have not submitted player code for the current season, so you are not participating in any games!";return{c(){e=w("p"),e.textContent=t,this.h()},l(l){e=g(l,"P",{class:!0,"data-svelte-h":!0}),x(e)!=="svelte-ibe853"&&(e.textContent=t),this.h()},h(){j(e,"class","svelte-1j7wjax")},m(l,s){S(l,e,s)},d(l){l&&_(e)}}}function Dt(r){let e;return{c(){e=T("Submit Code")},l(t){e=D(t,"Submit Code")},m(t,l){S(t,e,l)},d(t){t&&_(e)}}}function Nt(r){let e;return{c(){e=T("Code Submitted!")},l(t){e=D(t,"Code Submitted!")},m(t,l){S(t,e,l)},d(t){t&&_(e)}}}function Fe(r){let e,t=_e(r[5])+"",l;return{c(){e=w("div"),l=T(t),this.h()},l(s){e=g(s,"DIV",{class:!0});var n=A(e);l=D(n,t),n.forEach(_),this.h()},h(){j(e,"class","error svelte-1j7wjax")},m(s,n){S(s,e,n),d(e,l)},p(s,n){n[0]&32&&t!==(t=_e(s[5])+"")&&J(l,t)},d(s){s&&_(e)}}}function Ht(r){let e,t,l,s,n,a;e=new tt({props:{$$slots:{default:[yt]},$$scope:{ctx:r}}});const i=[gt,wt,kt],p=[];function C(h,m){return h[4]instanceof Promise?0:h[4]instanceof Error?1:h[0]?2:-1}return~(l=C(r))&&(s=p[l]=i[l](r)),{c(){je(e.$$.fragment),t=V(),s&&s.c(),n=$()},l(h){Ce(e.$$.fragment,h),t=M(h),s&&s.l(h),n=$()},m(h,m){Ee(e,h,m),S(h,t,m),~l&&p[l].m(h,m),S(h,n,m),a=!0},p(h,m){const I={};m[0]&4609|m[1]&32768&&(I.$$scope={dirty:m,ctx:h}),e.$set(I);let b=l;l=C(h),l===b?~l&&p[l].p(h,m):(s&&(Ze(),fe(p[b],1,1,()=>{p[b]=null}),xe()),~l?(s=p[l],s?s.p(h,m):(s=p[l]=i[l](h),s.c()),ue(s,1),s.m(n.parentNode,n)):s=null)},i(h){a||(ue(e.$$.fragment,h),ue(s),a=!0)},o(h){fe(e.$$.fragment,h),fe(s),a=!1},d(h){h&&(_(t),_(n)),Pe(e,h),~l&&p[l].d(h)}}}function Ot(r){let e,t;return e=new et({props:{title:"Player Dashboard",$$slots:{default:[Ht]},$$scope:{ctx:r}}}),{c(){je(e.$$.fragment)},l(l){Ce(e.$$.fragment,l)},m(l,s){Ee(e,l,s),t=!0},p(l,s){const n={};s[0]&16383|s[1]&32768&&(n.$$scope={dirty:s,ctx:l}),e.$set(n)},i(l){t||(ue(e.$$.fragment,l),t=!0)},o(l){fe(e.$$.fragment,l),t=!1},d(l){Pe(e,l)}}}function Je(r){return r.startsWith("0x")?r:`0x${r}`}function Vt(r,e,t){let l,s,n;ye(r,st,u=>t(22,n=u));const{wallet:a,publicClient:i,seasons:p}=nt();ye(r,a,u=>t(3,l=u)),ye(r,p,u=>t(21,s=u));let C,h,m,I=we(u=>t(4,C=u)),b=we(u=>t(5,h=u)),v=we(u=>t(6,m=u)),y=null,o=null,f=!1,c=!1,k=!1,O=0n,N=null,L=null,F,E=[];async function z(u){if(t(12,L=null),u.startsWith("github:")){const P=await(await fetch(`https://api.github.com/user/${u.slice(7)}`)).json();P.login&&t(12,L=`https://github.com/${P.login}`)}}async function X(u){let H=u.get("address")??null,P=u.get("name")??null;H||P?await I(W(H,P)):t(4,C=new Error("No player given"))}async function G(u,H,P){P=P??at(20);const[B,U,Y]=await De({client:i,calls:[{fn:"operators",args:[H,P]},{fn:"playerCodeHash",args:[u,H]},{fn:"canPlayerClaim",args:[H]}]});t(8,f=B||P===H),t(9,c=U!==dt),t(10,k=Y)}async function W(u,H){const P=await fetch(`${rt}/player-stats?${new URLSearchParams({...u?{address:u}:{name:H}})}`);if(!P.ok){if(P.status===404)throw new ee("Player not found");try{throw new ee(await P.json())}catch{throw new ee("Failed to load")}}const B=await P.json(),U=[];for(const Y of B.performance)(U[Y.season]=U[Y.season]??[]).push({...Y,time:new Date(Y.time)});U.reverse();for(const[Y,be]of U.entries())be?be.sort((Ge,Ke)=>Ke.time.getTime()-Ge.time.getTime()):U[Y]=[];t(0,o={playerAddress:B.address,playerName:B.name,seasonResults:U,userId:B.userId})}function q(){b(async()=>{if(!y)throw new ee("Invalid bytecode hex.");let u=y;if(u.startsWith("0x")||(u=`0x${u}`),!/^0x[a-f0-9]*$/i.test(u)&&u.length%2!==0)throw new ee("Invalid bytecode hex.");const H=u,P=it(H),B=await ht(N.publicKey,o.playerAddress,H);let U;try{U=await ot({client:l.client,fn:"submitCode",args:[N.idx,o.playerAddress,P,B]})}catch(Y){if(/rejected/.test(Y.message??""))return null;throw Y}return console.debug(`TX submitted: ${U}`),await ct(i,U),t(9,c=!0),U})}function te(){v(async()=>{if(!l||!o)return;let u=s.filter(P=>P.winner===(o==null?void 0:o.playerAddress)).map(P=>P.idx);if(u.length===0)return;const[...H]=await De({client:l.client,calls:u.map(P=>({fn:"winner",args:[P]}))});u=u.filter((P,B)=>H[B][2]!==0n),u.length!==0&&(await ut({client:l.client,calls:u.map(P=>({fn:"claim",args:[P,l.address]}))}),t(11,O=0n))})}async function ie(u){var P,B;const H=(P=u.dataTransfer)==null?void 0:P.items[0];if(H){if(H.type!=="application/json"&&H.type!=="text/plain"){t(5,h=new ee("Not a JSON compiler artifact."));return}const U=await((B=H.getAsFile())==null?void 0:B.text());try{t(7,y=oe(JSON.parse(U)))}catch(Y){if(Y instanceof ee)throw t(5,h=Y),Y;t(5,h=new ee("Artifact not valid JSON."))}}}function oe(u){var B;const H=/^0x[0-9a-f]*$/;let P=(B=u==null?void 0:u.bytecode)==null?void 0:B.object;if(typeof P=="string"&&H.test(P)||(P=u==null?void 0:u.bytecode,typeof P=="string"&&H.test(P)))return Je(P);throw new ee("Cannot find bytecode in artifact.")}async function ce(){var H;const u=(H=F.files)==null?void 0:H[0];if(!u){t(7,y="0x");return}try{t(7,y=oe(JSON.parse(await(u==null?void 0:u.text()))))}catch{t(5,h=new ee("Not a JSON compiler artifact."))}}function ne(u){We.call(this,r,u)}const Q=()=>te(),de=u=>t(2,E[u]=!0,E);function ae(){y=this.value,t(7,y)}function Z(u){qe[u?"unshift":"push"](()=>{F=u,t(13,F)})}const K=()=>ce(),R=()=>F.click();return r.$$.update=()=>{r.$$.dirty[0]&4194304&&X(n.url.searchParams),r.$$.dirty[0]&2097167&&(t(1,N=s[s.length-1]??null),N&&o&&(t(11,O=s.filter(u=>u.winner===o.playerAddress).map(u=>u.unclaimedPrize).reduce((u,H)=>u+H,0n)),G(N.idx,o.playerAddress,l==null?void 0:l.address)),t(2,E=s.map((u,H)=>E[H]??!1))),r.$$.dirty[0]&1&&o!=null&&o.userId&&z(o.userId)},[o,N,E,l,C,h,m,y,f,c,k,O,L,F,a,i,p,q,te,ie,ce,s,n,ne,Q,de,ae,Z,K,R]}class Kt extends Xe{constructor(e){super(),Qe(this,e,Vt,Ot,Ye,{},null,[-1,-1])}}export{Kt as component};
