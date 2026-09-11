__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0});var t=r(d[0]);Object.keys(t).forEach(function(n){'default'===n||Object.prototype.hasOwnProperty.call(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[n]}})})},1673,[1683]);
__d(function(g,r,_i,a,m,_e,d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"FirebaseError",{enumerable:!0,get:function(){return n.FirebaseError}}),Object.defineProperty(_e,"SDK_VERSION",{enumerable:!0,get:function(){return ie}}),Object.defineProperty(_e,"_DEFAULT_ENTRY_NAME",{enumerable:!0,get:function(){return H}}),Object.defineProperty(_e,"_addComponent",{enumerable:!0,get:function(){return U}}),Object.defineProperty(_e,"_addOrOverwriteComponent",{enumerable:!0,get:function(){return W}}),Object.defineProperty(_e,"_apps",{enumerable:!0,get:function(){return V}}),Object.defineProperty(_e,"_clearComponents",{enumerable:!0,get:function(){return Z}}),Object.defineProperty(_e,"_components",{enumerable:!0,get:function(){return L}}),Object.defineProperty(_e,"_getProvider",{enumerable:!0,get:function(){return K}}),Object.defineProperty(_e,"_isFirebaseApp",{enumerable:!0,get:function(){return G}}),Object.defineProperty(_e,"_isFirebaseServerApp",{enumerable:!0,get:function(){return X}}),Object.defineProperty(_e,"_isFirebaseServerAppSettings",{enumerable:!0,get:function(){return Q}}),Object.defineProperty(_e,"_registerComponent",{enumerable:!0,get:function(){return q}}),Object.defineProperty(_e,"_removeServiceInstance",{enumerable:!0,get:function(){return Y}}),Object.defineProperty(_e,"_serverApps",{enumerable:!0,get:function(){return J}}),Object.defineProperty(_e,"deleteApp",{enumerable:!0,get:function(){return le}}),Object.defineProperty(_e,"getApp",{enumerable:!0,get:function(){return ce}}),Object.defineProperty(_e,"getApps",{enumerable:!0,get:function(){return pe}}),Object.defineProperty(_e,"initializeApp",{enumerable:!0,get:function(){return oe}}),Object.defineProperty(_e,"initializeServerApp",{enumerable:!0,get:function(){return se}}),Object.defineProperty(_e,"onLog",{enumerable:!0,get:function(){return ue}}),Object.defineProperty(_e,"registerVersion",{enumerable:!0,get:function(){return fe}}),Object.defineProperty(_e,"setLogLevel",{enumerable:!0,get:function(){return he}});var e=r(d[0]),t=r(d[1]),n=r(d[2]),i=r(d[3]);
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class o{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(s(e)){const t=e.getImmediate();return`${t.library}/${t.version}`}return null}).filter(e=>e).join(' ')}}function s(e){const t=e.getComponent();return"VERSION"===t?.type}const c="@firebase/app",p="0.16.0",l=new t.Logger('@firebase/app'),f="@firebase/app-compat",u="@firebase/analytics-compat",h="@firebase/analytics",b="@firebase/app-check-compat",v="@firebase/app-check",C="@firebase/auth",w="@firebase/auth-compat",y="@firebase/database",_="@firebase/data-connect",D="@firebase/database-compat",O="@firebase/functions",P="@firebase/functions-compat",E="@firebase/installations",S="@firebase/installations-compat",j="@firebase/messaging",A="@firebase/messaging-compat",I="@firebase/performance",k="@firebase/performance-compat",N="@firebase/remote-config",$="@firebase/remote-config-compat",F="@firebase/storage",x="@firebase/storage-compat",R="@firebase/firestore",T="@firebase/ai",B="@firebase/firestore-compat",z="firebase",H='[DEFAULT]',M={[c]:'fire-core',[f]:'fire-core-compat',[h]:'fire-analytics',[u]:'fire-analytics-compat',[v]:'fire-app-check',[b]:'fire-app-check-compat',[C]:'fire-auth',[w]:'fire-auth-compat',[y]:'fire-rtdb',[_]:'fire-data-connect',[D]:'fire-rtdb-compat',[O]:'fire-fn',[P]:'fire-fn-compat',[E]:'fire-iid',[S]:'fire-iid-compat',[j]:'fire-fcm',[A]:'fire-fcm-compat',[I]:'fire-perf',[k]:'fire-perf-compat',[N]:'fire-rc',[$]:'fire-rc-compat',[F]:'fire-gcs',[x]:'fire-gcs-compat',[R]:'fire-fst',[B]:'fire-fst-compat',[T]:'fire-vertex','fire-js':'fire-js',[z]:'fire-js-all'},V=new Map,J=new Map,L=new Map;function U(e,t){try{e.container.addComponent(t)}catch(n){l.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function W(e,t){e.container.addOrOverwriteComponent(t)}function q(e){const t=e.name;if(L.has(t))return l.debug(`There were multiple attempts to register component ${t}.`),!1;L.set(t,e);for(const t of V.values())U(t,e);for(const t of J.values())U(t,e);return!0}function K(e,t){const n=e.container.getProvider('heartbeat').getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}function Y(e,t,n=H){K(e,t).clearInstance(n)}function G(e){return void 0!==e.options}function Q(e){return!G(e)&&('authIdToken'in e||'appCheckToken'in e||'releaseOnDeref'in e||'automaticDataCollectionEnabled'in e)}function X(e){return null!=e&&void 0!==e.settings}function Z(){L.clear()}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const ee={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":'Firebase Server App has been deleted',"no-options":'Need to provide options, when not being deployed to hosting via source.',"invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":'First argument to `onLog` must be null or a function.',"idb-open":'Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.',"idb-get":'Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.',"idb-set":'Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.',"idb-delete":'Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.',"finalization-registry-not-supported":'FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.',"invalid-server-app-environment":'FirebaseServerApp is not for use in browser environments.'},te=new n.ErrorFactory('app','Firebase',ee);
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class re{constructor(t,n,i){this._isDeleted=!1,this._options={...t},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=i,this.container.addComponent(new e.Component('app',()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw te.create("app-deleted",{appName:this._name})}}
/**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ae(e,t){const i=(0,n.base64Decode)(e.split('.')[1]);if(null===i)return void console.error(`FirebaseServerApp ${t} is invalid: second part could not be parsed.`);if(void 0===JSON.parse(i).exp)return void console.error(`FirebaseServerApp ${t} is invalid: expiration claim could not be parsed`);1e3*JSON.parse(i).exp-(new Date).getTime()<=0&&console.error(`FirebaseServerApp ${t} is invalid: the token has expired.`)}class ne extends re{constructor(e,t,n,i){const o=void 0===t.automaticDataCollectionEnabled||t.automaticDataCollectionEnabled,s={name:n,automaticDataCollectionEnabled:o};if(void 0!==e.apiKey)super(e,s,i);else{super(e.options,s,i)}this._serverConfig={automaticDataCollectionEnabled:o,...t},this._serverConfig.authIdToken&&ae(this._serverConfig.authIdToken,'authIdToken'),this._serverConfig.appCheckToken&&ae(this._serverConfig.appCheckToken,'appCheckToken'),this._finalizationRegistry=null,'undefined'!=typeof FinalizationRegistry&&(this._finalizationRegistry=new FinalizationRegistry(()=>{this.automaticCleanup()})),this._refCount=0,this.incRefCount(this._serverConfig.releaseOnDeref),this._serverConfig.releaseOnDeref=void 0,t.releaseOnDeref=void 0,fe(c,p,'serverapp')}toJSON(){}get refCount(){return this._refCount}incRefCount(e){this.isDeleted||(this._refCount++,void 0!==e&&null!==this._finalizationRegistry&&this._finalizationRegistry.register(e,this))}decRefCount(){return this.isDeleted?0:--this._refCount}automaticCleanup(){le(this)}get settings(){return this.checkDestroyed(),this._serverConfig}checkDestroyed(){if(this.isDeleted)throw te.create("server-app-deleted")}}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const ie="12.17.0";function oe(t,i={}){let o=t;if('object'!=typeof i){i={name:i}}const s={name:H,automaticDataCollectionEnabled:!0,...i},c=s.name;if('string'!=typeof c||!c)throw te.create("bad-app-name",{appName:String(c)});if(o||(o=(0,n.getDefaultAppConfig)()),!o)throw te.create("no-options");const p=V.get(c);if(p){if((0,n.deepEqual)(o,p.options)){if((0,n.deepEqual)(s,p.config))return p;throw te.create("duplicate-app",{appName:c,mismatchedParam:'config',oldValue:JSON.stringify(p.config),newValue:JSON.stringify(s)})}throw te.create("duplicate-app",{appName:c,mismatchedParam:'options',oldValue:JSON.stringify(p.options),newValue:JSON.stringify(o)})}const l=new e.ComponentContainer(c);for(const e of L.values())l.addComponent(e);const f=new re(o,s,l);return V.set(c,f),f}function se(t,i={}){if((0,n.isBrowser)()&&!(0,n.isWebWorker)())throw te.create("invalid-server-app-environment");let o,s=i||{};if(t&&(G(t)?o=t.options:Q(t)?s=t:o=t),void 0===s.automaticDataCollectionEnabled&&(s.automaticDataCollectionEnabled=!0),o||(o=(0,n.getDefaultAppConfig)()),!o)throw te.create("no-options");const c={...s,...o};void 0!==c.releaseOnDeref&&delete c.releaseOnDeref;if(void 0!==s.releaseOnDeref&&'undefined'==typeof FinalizationRegistry)throw te.create("finalization-registry-not-supported",{});const p=''+(l=JSON.stringify(c),[...l].reduce((e,t)=>Math.imul(31,e)+t.charCodeAt(0)|0,0));var l;const f=J.get(p);if(f)return f.incRefCount(s.releaseOnDeref),f;const u=new e.ComponentContainer(p);for(const e of L.values())u.addComponent(e);const h=new ne(o,s,p,u);return J.set(p,h),h}function ce(e=H){const t=V.get(e);if(!t&&e===H&&(0,n.getDefaultAppConfig)())return oe();if(!t)throw te.create("no-app",{appName:e});return t}function pe(){return Array.from(V.values())}async function le(e){let t=!1;const n=e.name;if(V.has(n))t=!0,V.delete(n);else if(J.has(n)){e.decRefCount()<=0&&(J.delete(n),t=!0)}t&&(await Promise.all(e.container.getProviders().map(e=>e.delete())),e.isDeleted=!0)}function fe(t,n,i){let o=M[t]??t;i&&(o+=`-${i}`);const s=o.match(/\s|\//),c=n.match(/\s|\//);if(s||c){const e=[`Unable to register library "${o}" with version "${n}":`];return s&&e.push(`library name "${o}" contains illegal characters (whitespace or "/")`),s&&c&&e.push('and'),c&&e.push(`version name "${n}" contains illegal characters (whitespace or "/")`),void l.warn(e.join(' '))}q(new e.Component(`${o}-version`,()=>({library:o,version:n}),"VERSION"))}function ue(e,n){if(null!==e&&'function'!=typeof e)throw te.create("invalid-log-argument");(0,t.setUserLogHandler)(e,n)}function he(e){(0,t.setLogLevel)(e)}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const de='firebase-heartbeat-store';let be=null;function ge(){return be||(be=(0,i.openDB)("firebase-heartbeat-database",1,{upgrade:(e,t)=>{if(0===t)try{e.createObjectStore(de)}catch(e){console.warn(e)}}}).catch(e=>{throw te.create("idb-open",{originalErrorMessage:e.message})})),be}async function me(e){try{const t=(await ge()).transaction(de),n=await t.objectStore(de).get(Ce(e));return await t.done,n}catch(e){if(e instanceof n.FirebaseError)l.warn(e.message);else{const t=te.create("idb-get",{originalErrorMessage:e?.message});l.warn(t.message)}}}async function ve(e,t){try{const n=(await ge()).transaction(de,'readwrite'),i=n.objectStore(de);await i.put(t,Ce(e)),await n.done}catch(e){if(e instanceof n.FirebaseError)l.warn(e.message);else{const t=te.create("idb-set",{originalErrorMessage:e?.message});l.warn(t.message)}}}function Ce(e){return`${e.name}!${e.options.appId}`}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class we{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider('app').getImmediate();this._storage=new Oe(t),this._heartbeatsCachePromise=this._storage.read().then(e=>(this._heartbeatsCache=e,e))}async triggerHeartbeat(){try{const e=this.container.getProvider('platform-logger').getImmediate().getPlatformInfoString(),t=ye();if(null==this._heartbeatsCache?.heartbeats&&(this._heartbeatsCache=await this._heartbeatsCachePromise,null==this._heartbeatsCache?.heartbeats))return;if(this._heartbeatsCache.lastSentHeartbeatDate===t||this._heartbeatsCache.heartbeats.some(e=>e.date===t))return;if(this._heartbeatsCache.heartbeats.push({date:t,agent:e}),this._heartbeatsCache.heartbeats.length>30){const e=Ee(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(e,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){l.warn(e)}}async getHeartbeatsHeader(){try{if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null==this._heartbeatsCache?.heartbeats||0===this._heartbeatsCache.heartbeats.length)return'';const e=ye(),{heartbeatsToSend:t,unsentEntries:i}=De(this._heartbeatsCache.heartbeats),o=(0,n.base64urlEncodeWithoutPadding)(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return l.warn(e),''}}}function ye(){return(new Date).toISOString().substring(0,10)}function De(e,t=1024){const n=[];let i=e.slice();for(const o of e){const e=n.find(e=>e.agent===o.agent);if(e){if(e.dates.push(o.date),Pe(n)>t){e.dates.pop();break}}else if(n.push({agent:o.agent,dates:[o.date]}),Pe(n)>t){n.pop();break}i=i.slice(1)}return{heartbeatsToSend:n,unsentEntries:i}}class Oe{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!(0,n.isIndexedDBAvailable)()&&(0,n.validateIndexedDBOpenable)().then(()=>!0).catch(()=>!1)}async read(){if(await this._canUseIndexedDBPromise){const e=await me(this.app);return e?.heartbeats?e:{heartbeats:[]}}return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const t=await this.read();return ve(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??t.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){if(await this._canUseIndexedDBPromise){const t=await this.read();return ve(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??t.lastSentHeartbeatDate,heartbeats:[...t.heartbeats,...e.heartbeats]})}}}function Pe(e){return(0,n.base64urlEncodeWithoutPadding)(JSON.stringify({version:2,heartbeats:e})).length}function Ee(e){if(0===e.length)return-1;let t=0,n=e[0].date;for(let i=1;i<e.length;i++)e[i].date<n&&(n=e[i].date,t=i);return t}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */var Se;
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */Se='',q(new e.Component('platform-logger',e=>new o(e),"PRIVATE")),q(new e.Component('heartbeat',e=>new we(e),"PRIVATE")),fe(c,p,Se),fe(c,p,'esm2020'),fe('fire-js','')},1676,[1677,1680,1678,1681]);
__d(function(g,r,i,a,m,_e,d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"Component",{enumerable:!0,get:function(){return t}}),Object.defineProperty(_e,"ComponentContainer",{enumerable:!0,get:function(){return c}}),Object.defineProperty(_e,"Provider",{enumerable:!0,get:function(){return s}});var e=r(d[0]);class t{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const n='[DEFAULT]';
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class s{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const t=new e.Deferred;if(this.instancesDeferred.set(n,t),this.isInitialized(n)||this.shouldAutoInitialize())try{const e=this.getOrInitializeService({instanceIdentifier:n});e&&t.resolve(e)}catch(e){}}return this.instancesDeferred.get(n).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e?.identifier),n=e?.optional??!1;if(!this.isInitialized(t)&&!this.shouldAutoInitialize()){if(n)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:t})}catch(e){if(n)return null;throw e}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,this.shouldAutoInitialize()){if(o(e))try{this.getOrInitializeService({instanceIdentifier:n})}catch(e){}for(const[e,t]of this.instancesDeferred.entries()){const n=this.normalizeInstanceIdentifier(e);try{const e=this.getOrInitializeService({instanceIdentifier:n});t.resolve(e)}catch(e){}}}}clearInstance(e=n){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(e=>'INTERNAL'in e).map(e=>e.INTERNAL.delete()),...e.filter(e=>'_delete'in e).map(e=>e._delete())])}isComponentSet(){return null!=this.component}isInitialized(e=n){return this.instances.has(e)}getOptions(e=n){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[e,t]of this.instancesDeferred.entries()){n===this.normalizeInstanceIdentifier(e)&&t.resolve(s)}return s}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);const o=this.instances.get(n);return o&&e(o,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:(o=e,o===n?void 0:o),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}var o;return s||null}normalizeInstanceIdentifier(e=n){return this.component?this.component.multipleInstances?e:n:e}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}function o(e){return"EAGER"===e.instantiationMode}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class c{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new s(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}},1677,[1678]);
__d(function(g,r,_i,_a,m,_e,_d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"CONSTANTS",{enumerable:!0,get:function(){return t}}),Object.defineProperty(_e,"DecodeBase64StringError",{enumerable:!0,get:function(){return u}}),Object.defineProperty(_e,"Deferred",{enumerable:!0,get:function(){return v}}),Object.defineProperty(_e,"ErrorFactory",{enumerable:!0,get:function(){return H}}),Object.defineProperty(_e,"FirebaseError",{enumerable:!0,get:function(){return z}}),Object.defineProperty(_e,"MAX_VALUE_MILLIS",{enumerable:!0,get:function(){return Ae}}),Object.defineProperty(_e,"RANDOM_FACTOR",{enumerable:!0,get:function(){return we}}),Object.defineProperty(_e,"Sha1",{enumerable:!0,get:function(){return fe}}),Object.defineProperty(_e,"areCookiesEnabled",{enumerable:!0,get:function(){return $}}),Object.defineProperty(_e,"assert",{enumerable:!0,get:function(){return n}}),Object.defineProperty(_e,"assertionError",{enumerable:!0,get:function(){return o}}),Object.defineProperty(_e,"async",{enumerable:!0,get:function(){return de}}),Object.defineProperty(_e,"base64",{enumerable:!0,get:function(){return c}}),Object.defineProperty(_e,"base64Decode",{enumerable:!0,get:function(){return l}}),Object.defineProperty(_e,"base64Encode",{enumerable:!0,get:function(){return a}}),Object.defineProperty(_e,"base64urlEncodeWithoutPadding",{enumerable:!0,get:function(){return f}}),Object.defineProperty(_e,"calculateBackoffMillis",{enumerable:!0,get:function(){return Ce}}),Object.defineProperty(_e,"contains",{enumerable:!0,get:function(){return ee}}),Object.defineProperty(_e,"createMockUserToken",{enumerable:!0,get:function(){return A}}),Object.defineProperty(_e,"createSubscribe",{enumerable:!0,get:function(){return le}}),Object.defineProperty(_e,"decode",{enumerable:!0,get:function(){return K}}),Object.defineProperty(_e,"deepCopy",{enumerable:!0,get:function(){return h}}),Object.defineProperty(_e,"deepEqual",{enumerable:!0,get:function(){return oe}}),Object.defineProperty(_e,"deepExtend",{enumerable:!0,get:function(){return d}}),Object.defineProperty(_e,"errorPrefix",{enumerable:!0,get:function(){return ye}}),Object.defineProperty(_e,"extractQuerystring",{enumerable:!0,get:function(){return ae}}),Object.defineProperty(_e,"generateSHA256Hash",{enumerable:!0,get:function(){return Be}}),Object.defineProperty(_e,"getDefaultAppConfig",{enumerable:!0,get:function(){return S}}),Object.defineProperty(_e,"getDefaultEmulatorHost",{enumerable:!0,get:function(){return j}}),Object.defineProperty(_e,"getDefaultEmulatorHostnameAndPort",{enumerable:!0,get:function(){return E}}),Object.defineProperty(_e,"getDefaults",{enumerable:!0,get:function(){return _}}),Object.defineProperty(_e,"getExperimentalSetting",{enumerable:!0,get:function(){return P}}),Object.defineProperty(_e,"getGlobal",{enumerable:!0,get:function(){return p}}),Object.defineProperty(_e,"getModularInstance",{enumerable:!0,get:function(){return ke}}),Object.defineProperty(_e,"getUA",{enumerable:!0,get:function(){return w}}),Object.defineProperty(_e,"isAdmin",{enumerable:!0,get:function(){return Z}}),Object.defineProperty(_e,"isBrowser",{enumerable:!0,get:function(){return T}}),Object.defineProperty(_e,"isBrowserExtension",{enumerable:!0,get:function(){return M}}),Object.defineProperty(_e,"isCloudWorkstation",{enumerable:!0,get:function(){return Ne}}),Object.defineProperty(_e,"isCloudflareWorker",{enumerable:!0,get:function(){return N}}),Object.defineProperty(_e,"isElectron",{enumerable:!0,get:function(){return x}}),Object.defineProperty(_e,"isEmpty",{enumerable:!0,get:function(){return re}}),Object.defineProperty(_e,"isIE",{enumerable:!0,get:function(){return I}}),Object.defineProperty(_e,"isIndexedDBAvailable",{enumerable:!0,get:function(){return F}}),Object.defineProperty(_e,"isMobileCordova",{enumerable:!0,get:function(){return C}}),Object.defineProperty(_e,"isNode",{enumerable:!0,get:function(){return D}}),Object.defineProperty(_e,"isNodeSdk",{enumerable:!0,get:function(){return L}}),Object.defineProperty(_e,"isReactNative",{enumerable:!0,get:function(){return B}}),Object.defineProperty(_e,"isSafari",{enumerable:!0,get:function(){return R}}),Object.defineProperty(_e,"isSafariOrWebkit",{enumerable:!0,get:function(){return U}}),Object.defineProperty(_e,"isUWP",{enumerable:!0,get:function(){return W}}),Object.defineProperty(_e,"isValidFormat",{enumerable:!0,get:function(){return Y}}),Object.defineProperty(_e,"isValidTimestamp",{enumerable:!0,get:function(){return Q}}),Object.defineProperty(_e,"isWebWorker",{enumerable:!0,get:function(){return k}}),Object.defineProperty(_e,"issuedAtTime",{enumerable:!0,get:function(){return X}}),Object.defineProperty(_e,"jsonEval",{enumerable:!0,get:function(){return G}}),Object.defineProperty(_e,"map",{enumerable:!0,get:function(){return ne}}),Object.defineProperty(_e,"ordinal",{enumerable:!0,get:function(){return De}}),Object.defineProperty(_e,"pingServer",{enumerable:!0,get:function(){return Me}}),Object.defineProperty(_e,"promiseWithTimeout",{enumerable:!0,get:function(){return se}}),Object.defineProperty(_e,"querystring",{enumerable:!0,get:function(){return ce}}),Object.defineProperty(_e,"querystringDecode",{enumerable:!0,get:function(){return ue}}),Object.defineProperty(_e,"safeGet",{enumerable:!0,get:function(){return te}}),Object.defineProperty(_e,"stringLength",{enumerable:!0,get:function(){return Se}}),Object.defineProperty(_e,"stringToByteArray",{enumerable:!0,get:function(){return Ee}}),Object.defineProperty(_e,"stringify",{enumerable:!0,get:function(){return q}}),Object.defineProperty(_e,"validateArgCount",{enumerable:!0,get:function(){return ge}}),Object.defineProperty(_e,"validateCallback",{enumerable:!0,get:function(){return Oe}}),Object.defineProperty(_e,"validateContextObject",{enumerable:!0,get:function(){return je}}),Object.defineProperty(_e,"validateIndexedDBOpenable",{enumerable:!0,get:function(){return V}}),Object.defineProperty(_e,"validateNamespace",{enumerable:!0,get:function(){return me}});var e=r(_d[0]);
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const t={NODE_CLIENT:!1,NODE_ADMIN:!1,SDK_VERSION:'${JSCORE_VERSION}'},n=function(e,t){if(!e)throw o(t)},o=function(e){return new Error('Firebase Database ('+t.SDK_VERSION+') INTERNAL ASSERT FAILED: '+e)},i=function(e){const t=[];let n=0;for(let o=0;o<e.length;o++){let i=e.charCodeAt(o);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=63&i|128):55296==(64512&i)&&o+1<e.length&&56320==(64512&e.charCodeAt(o+1))?(i=65536+((1023&i)<<10)+(1023&e.charCodeAt(++o)),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=63&i|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=63&i|128)}return t},s=function(e){const t=[];let n=0,o=0;for(;n<e.length;){const i=e[n++];if(i<128)t[o++]=String.fromCharCode(i);else if(i>191&&i<224){const s=e[n++];t[o++]=String.fromCharCode((31&i)<<6|63&s)}else if(i>239&&i<365){const s=((7&i)<<18|(63&e[n++])<<12|(63&e[n++])<<6|63&e[n++])-65536;t[o++]=String.fromCharCode(55296+(s>>10)),t[o++]=String.fromCharCode(56320+(1023&s))}else{const s=e[n++],c=e[n++];t[o++]=String.fromCharCode((15&i)<<12|(63&s)<<6|63&c)}}return t.join('')},c={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+'+/='},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+'-_.'},HAS_NATIVE_SUPPORT:'function'==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error('encodeByteArray takes an array as a parameter');this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,o=[];for(let t=0;t<e.length;t+=3){const i=e[t],s=t+1<e.length,c=s?e[t+1]:0,u=t+2<e.length,a=u?e[t+2]:0,f=i>>2,l=(3&i)<<4|c>>4;let h=(15&c)<<2|a>>6,d=63&a;u||(d=64,s||(h=64)),o.push(n[f],n[l],n[h],n[d])}return o.join('')},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(i(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):s(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,o=[];for(let t=0;t<e.length;){const i=n[e.charAt(t++)],s=t<e.length?n[e.charAt(t)]:0;++t;const c=t<e.length?n[e.charAt(t)]:64;++t;const a=t<e.length?n[e.charAt(t)]:64;if(++t,null==i||null==s||null==c||null==a)throw new u;const f=i<<2|s>>4;if(o.push(f),64!==c){const e=s<<4&240|c>>2;if(o.push(e),64!==a){const e=c<<6&192|a;o.push(e)}}}return o},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class u extends Error{constructor(){super(...arguments),this.name='DecodeBase64StringError'}}const a=function(e){const t=i(e);return c.encodeByteArray(t,!0)},f=function(e){return a(e).replace(/\./g,'')},l=function(e){try{return c.decodeString(e,!0)}catch(e){console.error('base64Decode failed: ',e)}return null};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function h(e){return d(void 0,e)}function d(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:return new Date(t.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(const n in t)t.hasOwnProperty(n)&&b(n)&&(e[n]=d(e[n],t[n]));return e}function b(e){return'__proto__'!==e}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function p(){if('undefined'!=typeof self)return self;if('undefined'!=typeof window)return window;if(void 0!==g)return g;throw new Error('Unable to locate global object.')}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const y=()=>{if('undefined'==typeof process||void 0===process.env)return;const e=process.env.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0},O=()=>{if('undefined'==typeof document)return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}const t=e&&l(e[1]);return t&&JSON.parse(t)},_=()=>{try{return(0,e.getDefaultsFromPostinstall)()||p().__FIREBASE_DEFAULTS__||y()||O()}catch(e){return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`)}},j=e=>_()?.emulatorHosts?.[e],E=e=>{const t=j(e);if(!t)return;const n=t.lastIndexOf(':');if(n<=0||n+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const o=parseInt(t.substring(n+1),10);return'['===t[0]?[t.substring(1,n-1),o]:[t.substring(0,n),o]},S=()=>_()?.config,P=e=>_()?.[`_${e}`];
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class v{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),'function'==typeof e&&(this.promise.catch(()=>{}),1===e.length?e(t):e(t,n))}}}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function A(e,t){if(e.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n=t||'demo-project',o=e.iat||0,i=e.sub||e.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const s={iss:`https://securetoken.google.com/${n}`,aud:n,iat:o,exp:o+3600,auth_time:o,sub:i,user_id:i,firebase:{sign_in_provider:'custom',identities:{}},...e};return[f(JSON.stringify({alg:'none',type:'JWT'})),f(JSON.stringify(s)),''].join('.')}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function w(){return'undefined'!=typeof navigator&&'string'==typeof navigator.userAgent?navigator.userAgent:''}function C(){return'undefined'!=typeof window&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(w())}function D(){const e=_()?.forceEnvironment;if('node'===e)return!0;if('browser'===e)return!1;try{return'[object process]'===Object.prototype.toString.call(g.process)}catch(e){return!1}}function T(){return'undefined'!=typeof window||k()}function k(){return'undefined'!=typeof WorkerGlobalScope&&'undefined'!=typeof self&&self instanceof WorkerGlobalScope}function N(){return'undefined'!=typeof navigator&&'Cloudflare-Workers'===navigator.userAgent}function M(){const e='object'==typeof chrome?chrome.runtime:'object'==typeof browser?browser.runtime:void 0;return'object'==typeof e&&void 0!==e.id}function B(){return'object'==typeof navigator&&'ReactNative'===navigator.product}function x(){return w().indexOf('Electron/')>=0}function I(){const e=w();return e.indexOf('MSIE ')>=0||e.indexOf('Trident/')>=0}function W(){return w().indexOf('MSAppHost/')>=0}function L(){return!0===t.NODE_CLIENT||!0===t.NODE_ADMIN}function R(){return!D()&&!!navigator.userAgent&&navigator.userAgent.includes('Safari')&&!navigator.userAgent.includes('Chrome')}function U(){return!D()&&!!navigator.userAgent&&(navigator.userAgent.includes('Safari')||navigator.userAgent.includes('WebKit'))&&!navigator.userAgent.includes('Chrome')}function F(){try{return'object'==typeof indexedDB}catch(e){return!1}}function V(){return new Promise((e,t)=>{try{let n=!0;const o='validate-browser-context-for-indexeddb-analytics-module',i=self.indexedDB.open(o);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(o),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{t(i.error?.message||'')}}catch(e){t(e)}})}function $(){return!('undefined'==typeof navigator||!navigator.cookieEnabled)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class z extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,z.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,H.prototype.create)}}class H{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},o=`${this.service}/${e}`,i=this.errors[e],s=i?J(i,n):'Error',c=`${this.serviceName}: ${s} (${o}).`;return new z(o,c,n)}}function J(e,t){try{let n=0,o='';for(;n<e.length;){const i=e.indexOf('{$',n);if(-1===i){o+=e.substring(n);break}const s=e.indexOf('}',i+2);if(-1===s){o+=e.substring(n);break}const c=e.substring(i+2,s),u=t[c];o+=e.substring(n,i)+(null!=u?String(u):`<${c}?>`),n=s+1}return o}catch(t){return e}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function G(e){return JSON.parse(e)}function q(e){return JSON.stringify(e)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const K=function(e){let t={},n={},o={},i='';try{const s=e.split('.');t=G(l(s[0])||''),n=G(l(s[1])||''),i=s[2],o=n.d||{},delete n.d}catch(e){}return{header:t,claims:n,data:o,signature:i}},Q=function(e){const t=K(e).claims,n=Math.floor((new Date).getTime()/1e3);let o=0,i=0;return'object'==typeof t&&(t.hasOwnProperty('nbf')?o=t.nbf:t.hasOwnProperty('iat')&&(o=t.iat),i=t.hasOwnProperty('exp')?t.exp:o+86400),!!n&&!!o&&!!i&&n>=o&&n<=i},X=function(e){const t=K(e).claims;return'object'==typeof t&&t.hasOwnProperty('iat')?t.iat:null},Y=function(e){const t=K(e).claims;return!!t&&'object'==typeof t&&t.hasOwnProperty('iat')},Z=function(e){const t=K(e).claims;return'object'==typeof t&&!0===t.admin};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function ee(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function te(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:void 0}function re(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function ne(e,t,n){const o={};for(const i in e)Object.prototype.hasOwnProperty.call(e,i)&&(o[i]=t.call(n,e[i],i,e));return o}function oe(e,t){if(e===t)return!0;const n=Object.keys(e),o=Object.keys(t);for(const i of n){if(!o.includes(i))return!1;const n=e[i],s=t[i];if(ie(n)&&ie(s)){if(!oe(n,s))return!1}else if(n!==s)return!1}for(const e of o)if(!n.includes(e))return!1;return!0}function ie(e){return null!==e&&'object'==typeof e}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function se(e,t=2e3){const n=new v;return setTimeout(()=>n.reject('timeout!'),t),e.then(n.resolve,n.reject),n.promise}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ce(e){const t=[];for(const[n,o]of Object.entries(e))Array.isArray(o)?o.forEach(e=>{t.push(encodeURIComponent(n)+'='+encodeURIComponent(e))}):t.push(encodeURIComponent(n)+'='+encodeURIComponent(o));return t.length?'&'+t.join('&'):''}function ue(e){const t={};return e.replace(/^\?/,'').split('&').forEach(e=>{if(e){const[n,o]=e.split('=');t[decodeURIComponent(n)]=decodeURIComponent(o)}}),t}function ae(e){const t=e.indexOf('?');if(!t)return'';const n=e.indexOf('#',t);return e.substring(t,n>0?n:void 0)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class fe{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=64,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const n=this.W_;if('string'==typeof e)for(let o=0;o<16;o++)n[o]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let o=0;o<16;o++)n[o]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let e=16;e<80;e++){const t=n[e-3]^n[e-8]^n[e-14]^n[e-16];n[e]=4294967295&(t<<1|t>>>31)}let o,i,s=this.chain_[0],c=this.chain_[1],u=this.chain_[2],a=this.chain_[3],f=this.chain_[4];for(let e=0;e<80;e++){e<40?e<20?(o=a^c&(u^a),i=1518500249):(o=c^u^a,i=1859775393):e<60?(o=c&u|a&(c|u),i=2400959708):(o=c^u^a,i=3395469782);const t=(s<<5|s>>>27)+o+f+i+n[e]&4294967295;f=a,a=u,u=4294967295&(c<<30|c>>>2),c=s,s=t}this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+c&4294967295,this.chain_[2]=this.chain_[2]+u&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+f&4294967295}update(e,t){if(null==e)return;void 0===t&&(t=e.length);const n=t-this.blockSize;let o=0;const i=this.buf_;let s=this.inbuf_;for(;o<t;){if(0===s)for(;o<=n;)this.compress_(e,o),o+=this.blockSize;if('string'==typeof e){for(;o<t;)if(i[s]=e.charCodeAt(o),++s,++o,s===this.blockSize){this.compress_(i),s=0;break}}else for(;o<t;)if(i[s]=e[o],++s,++o,s===this.blockSize){this.compress_(i),s=0;break}}this.inbuf_=s,this.total_+=t}digest(){const e=[];let t=8*this.total_;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let e=this.blockSize-1;e>=56;e--)this.buf_[e]=255&t,t/=256;this.compress_(this.buf_);let n=0;for(let t=0;t<5;t++)for(let o=24;o>=0;o-=8)e[n]=this.chain_[t]>>o&255,++n;return e}}function le(e,t){const n=new he(e,t);return n.subscribe.bind(n)}class he{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(e=>{this.error(e)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let o;if(void 0===e&&void 0===t&&void 0===n)throw new Error('Missing Observer.');o=be(e,['next','error','complete'])?e:{next:e,error:t,complete:n},void 0===o.next&&(o.next=pe),void 0===o.error&&(o.error=pe),void 0===o.complete&&(o.complete=pe);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?o.error(this.finalError):o.complete()}catch(e){}}),this.observers.push(o),i}unsubscribeOne(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(void 0!==this.observers&&void 0!==this.observers[e])try{t(this.observers[e])}catch(e){'undefined'!=typeof console&&console.error&&console.error(e)}})}close(e){this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function de(e,t){return(...n)=>{Promise.resolve(!0).then(()=>{e(...n)}).catch(e=>{t&&t(e)})}}function be(e,t){if('object'!=typeof e||null===e)return!1;for(const n of t)if(n in e&&'function'==typeof e[n])return!0;return!1}function pe(){}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const ge=function(e,t,n,o){let i;if(o<t?i='at least '+t:o>n&&(i=0===n?'none':'no more than '+n),i){throw new Error(e+' failed: Was called with '+o+(1===o?' argument.':' arguments.')+' Expects '+i+'.')}};function ye(e,t){return`${e} failed: ${t} argument `}function me(e,t,n){if((!n||t)&&'string'!=typeof t)throw new Error(ye(e,'namespace')+'must be a valid firebase namespace.')}function Oe(e,t,n,o){if((!o||n)&&'function'!=typeof n)throw new Error(ye(e,t)+'must be a valid function.')}function je(e,t,n,o){if((!o||n)&&('object'!=typeof n||null===n))throw new Error(ye(e,t)+'must be a valid context object.')}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const Ee=function(e){const t=[];let o=0;for(let i=0;i<e.length;i++){let s=e.charCodeAt(i);if(s>=55296&&s<=56319){const t=s-55296;i++,n(i<e.length,'Surrogate pair missing trail surrogate.');s=65536+(t<<10)+(e.charCodeAt(i)-56320)}s<128?t[o++]=s:s<2048?(t[o++]=s>>6|192,t[o++]=63&s|128):s<65536?(t[o++]=s>>12|224,t[o++]=s>>6&63|128,t[o++]=63&s|128):(t[o++]=s>>18|240,t[o++]=s>>12&63|128,t[o++]=s>>6&63|128,t[o++]=63&s|128)}return t},Se=function(e){let t=0;for(let n=0;n<e.length;n++){const o=e.charCodeAt(n);o<128?t++:o<2048?t+=2:o>=55296&&o<=56319?(t+=4,n++):t+=3}return t},Pe=1e3,ve=2,Ae=144e5,we=.5;function Ce(e,t=Pe,n=ve){const o=t*Math.pow(n,e),i=Math.round(we*o*(Math.random()-.5)*2);return Math.min(Ae,o+i)}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function De(e){return Number.isFinite(e)?e+Te(e):`${e}`}function Te(e){const t=(e=Math.abs(e))%100;if(t>=10&&t<=20)return'th';const n=e%10;return 1===n?'st':2===n?'nd':3===n?'rd':'th'}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ke(e){return e&&e._delegate?e._delegate:e}
/**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Ne(e){try{return(e.startsWith('http://')||e.startsWith('https://')?new URL(e).hostname:e).endsWith('.cloudworkstations.dev')}catch{return!1}}async function Me(e){return(await fetch(e,{credentials:'include'})).ok}
/**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function Be(e){const t=(new TextEncoder).encode(e),n=await crypto.subtle.digest('SHA-256',t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,'0')).join('')}},1678,[1679]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"getDefaultsFromPostinstall",{enumerable:!0,get:function(){return t}});const t=()=>{}},1679,[]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"LogLevel",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"Logger",{enumerable:!0,get:function(){return h}}),Object.defineProperty(e,"setLogLevel",{enumerable:!0,get:function(){return L}}),Object.defineProperty(e,"setUserLogHandler",{enumerable:!0,get:function(){return f}});
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
const t=[];var n;!(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(n||(n={}));const o={debug:n.DEBUG,verbose:n.VERBOSE,info:n.INFO,warn:n.WARN,error:n.ERROR,silent:n.SILENT},l=n.INFO,s={[n.DEBUG]:'log',[n.VERBOSE]:'log',[n.INFO]:'info',[n.WARN]:'warn',[n.ERROR]:'error'},u=(t,n,...o)=>{if(n<t.logLevel)return;const l=(new Date).toISOString(),u=s[n];if(!u)throw new Error(`Attempted to log a message with an invalid logType (value: ${n})`);console[u](`[${l}]  ${t.name}:`,...o)};class h{constructor(n){this.name=n,this._logLevel=l,this._logHandler=u,this._userLogHandler=null,t.push(this)}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in n))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel='string'==typeof t?o[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if('function'!=typeof t)throw new TypeError('Value assigned to `logHandler` must be a function');this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,n.DEBUG,...t),this._logHandler(this,n.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,n.VERBOSE,...t),this._logHandler(this,n.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,n.INFO,...t),this._logHandler(this,n.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,n.WARN,...t),this._logHandler(this,n.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,n.ERROR,...t),this._logHandler(this,n.ERROR,...t)}}function L(n){t.forEach(t=>{t.setLogLevel(n)})}function f(l,s){for(const u of t){let t=null;s&&s.level&&(t=o[s.level]),u.userLogHandler=null===l?null:(o,s,...u)=>{const h=u.map(t=>{if(null==t)return null;if('string'==typeof t)return t;if('number'==typeof t||'boolean'==typeof t)return t.toString();if(t instanceof Error)return t.message;try{return JSON.stringify(t)}catch(t){return null}}).filter(t=>t).join(' ');s>=(t??o.logLevel)&&l({level:n[s].toLowerCase(),message:h,args:u,type:o.name})}}}},1680,[]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"unwrap",{enumerable:!0,get:function(){return n.u}}),Object.defineProperty(e,"wrap",{enumerable:!0,get:function(){return n.w}}),Object.defineProperty(e,"deleteDB",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"openDB",{enumerable:!0,get:function(){return t}});var n=r(d[0]);function t(t,o,{blocked:s,upgrade:c,blocking:u,terminated:l}={}){const f=indexedDB.open(t,o),b=(0,n.w)(f);return c&&f.addEventListener('upgradeneeded',t=>{c((0,n.w)(f.result),t.oldVersion,t.newVersion,(0,n.w)(f.transaction),t)}),s&&f.addEventListener('blocked',n=>s(n.oldVersion,n.newVersion,n)),b.then(n=>{l&&n.addEventListener('close',()=>l()),u&&n.addEventListener('versionchange',n=>u(n.oldVersion,n.newVersion,n))}).catch(()=>{}),b}function o(t,{blocked:o}={}){const s=indexedDB.deleteDatabase(t);return o&&s.addEventListener('blocked',n=>o(n.oldVersion,n)),(0,n.w)(s).then(()=>{})}const s=['get','getKey','getAll','getAllKeys','count'],c=['put','add','delete','clear'],u=new Map;function l(n,t){if(!(n instanceof IDBDatabase)||t in n||'string'!=typeof t)return;if(u.get(t))return u.get(t);const o=t.replace(/FromIndex$/,''),l=t!==o,f=c.includes(o);if(!(o in(l?IDBIndex:IDBObjectStore).prototype)||!f&&!s.includes(o))return;const b=async function(n,...t){const s=this.transaction(n,f?'readwrite':'readonly');let c=s.store;return l&&(c=c.index(t.shift())),(await Promise.all([c[o](...t),f&&s.done]))[0]};return u.set(t,b),b}(0,n.r)(n=>({...n,get:(t,o,s)=>l(t,o)||n.get(t,o,s),has:(t,o)=>!!l(t,o)||n.has(t,o)}))},1681,[1682]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"a",{enumerable:!0,get:function(){return p}}),Object.defineProperty(e,"i",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"r",{enumerable:!0,get:function(){return l}}),Object.defineProperty(e,"u",{enumerable:!0,get:function(){return B}}),Object.defineProperty(e,"w",{enumerable:!0,get:function(){return I}});const t=(t,n)=>n.some(n=>t instanceof n);let n,o;const s=new WeakMap,c=new WeakMap,u=new WeakMap,f=new WeakMap,p=new WeakMap;function b(t){const n=new Promise((n,o)=>{const s=()=>{t.removeEventListener('success',c),t.removeEventListener('error',u)},c=()=>{n(I(t.result)),s()},u=()=>{o(t.error),s()};t.addEventListener('success',c),t.addEventListener('error',u)});return n.then(n=>{n instanceof IDBCursor&&s.set(n,t)}).catch(()=>{}),p.set(n,t),n}function v(t){if(c.has(t))return;const n=new Promise((n,o)=>{const s=()=>{t.removeEventListener('complete',c),t.removeEventListener('error',u),t.removeEventListener('abort',u)},c=()=>{n(),s()},u=()=>{o(t.error||new DOMException('AbortError','AbortError')),s()};t.addEventListener('complete',c),t.addEventListener('error',u),t.addEventListener('abort',u)});c.set(t,n)}let D={get(t,n,o){if(t instanceof IDBTransaction){if('done'===n)return c.get(t);if('objectStoreNames'===n)return t.objectStoreNames||u.get(t);if('store'===n)return o.objectStoreNames[1]?void 0:o.objectStore(o.objectStoreNames[0])}return I(t[n])},set:(t,n,o)=>(t[n]=o,!0),has:(t,n)=>t instanceof IDBTransaction&&('done'===n||'store'===n)||n in t};function l(t){D=t(D)}function y(c){return'function'==typeof c?(f=c)!==IDBDatabase.prototype.transaction||'objectStoreNames'in IDBTransaction.prototype?(o||(o=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(f)?function(...t){return f.apply(B(this),t),I(s.get(this))}:function(...t){return I(f.apply(B(this),t))}:function(t,...n){const o=f.call(B(this),t,...n);return u.set(o,t.sort?t.sort():[t]),I(o)}:(c instanceof IDBTransaction&&v(c),t(c,n||(n=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction]))?new Proxy(c,D):c);var f}function I(t){if(t instanceof IDBRequest)return b(t);if(f.has(t))return f.get(t);const n=y(t);return n!==t&&(f.set(t,n),p.set(n,t)),n}const B=t=>p.get(t)},1682,[]);
__d(function(g,r,_i,a,m,_e,d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"deleteToken",{enumerable:!0,get:function(){return Ze}}),Object.defineProperty(_e,"getMessaging",{enumerable:!0,get:function(){return ze}}),Object.defineProperty(_e,"getToken",{enumerable:!0,get:function(){return Ye}}),Object.defineProperty(_e,"isSupported",{enumerable:!0,get:function(){return Le}}),Object.defineProperty(_e,"onMessage",{enumerable:!0,get:function(){return Xe}}),Object.defineProperty(_e,"onRegistered",{enumerable:!0,get:function(){return nt}}),Object.defineProperty(_e,"onUnregistered",{enumerable:!0,get:function(){return it}}),Object.defineProperty(_e,"register",{enumerable:!0,get:function(){return et}}),Object.defineProperty(_e,"unregister",{enumerable:!0,get:function(){return tt}});var e=r(d[0]),t=r(d[1]),n=r(d[2]),i=r(d[3]),o=r(d[4]);
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
const s='/firebase-messaging-sw.js',c='/firebase-cloud-messaging-push-scope',u='BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4',f='https://fcmregistrations.googleapis.com/v1',p='google.c.a.c_id',l=1e4;var w,h;
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function b(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}function y(e){const t=(e+'='.repeat((4-e.length%4)%4)).replace(/\-/g,'+').replace(/_/g,'/'),n=atob(t),i=new Uint8Array(n.length);for(let e=0;e<n.length;++e)i[e]=n.charCodeAt(e);return i}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */!(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(w||(w={})),(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked",e.FID_REGISTERED="fid-registered"})(h||(h={}));const v='fcm_token_details_db',I=5,k='fcm_token_object_Store';async function D(e){if('databases'in indexedDB){const e=(await indexedDB.databases()).map(e=>e.name);if(!e.includes(v))return null}let t=null;return(await(0,n.openDB)(v,I,{upgrade:async(n,i,o,s)=>{if(i<2)return;if(!n.objectStoreNames.contains(k))return;const c=s.objectStore(k),u=await c.index('fcmSenderId').get(e);if(await c.clear(),u)if(2===i){const e=u;if(!e.auth||!e.p256dh||!e.endpoint)return;t={token:e.fcmToken,createTime:e.createTime??Date.now(),subscriptionOptions:{auth:e.auth,p256dh:e.p256dh,endpoint:e.endpoint,swScope:e.swScope,vapidKey:'string'==typeof e.vapidKey?e.vapidKey:b(e.vapidKey)}}}else if(3===i){const e=u;t={token:e.fcmToken,createTime:e.createTime,subscriptionOptions:{auth:b(e.auth),p256dh:b(e.p256dh),endpoint:e.endpoint,swScope:e.swScope,vapidKey:b(e.vapidKey)}}}else if(4===i){const e=u;t={token:e.fcmToken,createTime:e.createTime,subscriptionOptions:{auth:b(e.auth),p256dh:b(e.p256dh),endpoint:e.endpoint,swScope:e.swScope,vapidKey:b(e.vapidKey)}}}}})).close(),await(0,n.deleteDB)(v),await(0,n.deleteDB)('fcm_vapid_details_db'),await(0,n.deleteDB)('undefined'),S(t)?t:null}function S(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return'number'==typeof e.createTime&&e.createTime>0&&'string'==typeof e.token&&e.token.length>0&&'string'==typeof t.auth&&t.auth.length>0&&'string'==typeof t.p256dh&&t.p256dh.length>0&&'string'==typeof t.endpoint&&t.endpoint.length>0&&'string'==typeof t.swScope&&t.swScope.length>0&&'string'==typeof t.vapidKey&&t.vapidKey.length>0}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const T={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":'This method is available in a Window context.',"only-available-in-sw":'This method is available in a service worker context.',"permission-default":'The notification permission was not granted and dismissed instead.',"permission-blocked":'The notification permission was not granted and blocked instead.',"unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":'We are unable to register the default service worker. {$browserErrorMessage}',"token-subscribe-failed":'A problem occurred while subscribing the user to FCM: {$errorInfo}',"token-subscribe-no-token":'FCM returned no token when subscribing the user to push.',"fid-registration-failed":'A problem occurred while creating an FCM registration via FID: {$errorInfo}',"fid-unregister-failed":'A problem occurred while unregistering the FCM registration via FID: {$errorInfo}',"fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":'A problem occurred while updating the user from FCM: {$errorInfo}',"token-update-no-token":'FCM returned no token when updating the user to push.',"use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":'The input to useServiceWorker() must be a ServiceWorkerRegistration.',"invalid-bg-handler":'The input to setBackgroundMessageHandler() must be a function.',"invalid-vapid-key":'The public VAPID key must be a string.',"use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":'No onRegistered callback handler was provided or registered. Implement onRegistered() before register().'},C=new i.ErrorFactory('messaging','Messaging',T),_='firebase-messaging-database',O=2,R='firebase-messaging-store',M='firebase-messaging-fid-registration-store';let P={openDB:n.openDB,deleteDB:n.deleteDB},K=null;function j(e,t,n){switch(t){case 0:if(e.createObjectStore(R),1===n)break;case 1:2===n&&e.createObjectStore(M)}}function E(e){return{upgrade:(t,n)=>{j(t,n,e)},blocked:()=>{},blocking:(e,t,n)=>{K=null,n.target?.close()},terminated:()=>{K=null}}}function N(){if(!K){const e=P.openDB(_,O,E(2));K=e.catch(()=>P.openDB(_,1,E(1)))}return K}function A(e,t){return e.objectStoreNames.contains(t)}function H(e){if(!A(e,M))throw C.create("fid-registration-idb-schema-unavailable")}async function x(e){const t=L(e),n=await N(),i=await n.transaction(R).objectStore(R).get(t);if(i)return i;{const t=await D(e.appConfig.senderId);if(t)return await F(e,t),t}}async function F(e,t){const n=L(e),i=await N(),o=[R],s=A(i,M);s&&o.push(M);const c=i.transaction(o,'readwrite');return await c.objectStore(R).put(t,n),s&&await c.objectStore(M).delete(n),await c.done,t}async function U(e){const t=L(e),n=(await N()).transaction(R,'readwrite');await n.objectStore(R).delete(t),await n.done}async function B(e){const t=L(e),n=await N();return H(n),await n.transaction(M).objectStore(M).get(t)}async function $(e,t){const n=L(e),i=await N();H(i);const o=i.transaction([R,M],'readwrite');return await o.objectStore(M).put(t,n),await o.objectStore(R).delete(n),await o.done,t}async function W(e){const t=L(e),n=await N();H(n);const i=n.transaction(M,'readwrite');await i.objectStore(M).delete(t),await i.done}function L({appConfig:e}){return e.appId}const V="@firebase/messaging",G="0.13.1",J=3,Q=1e3;async function q(e,t){const n=await ae(e),i=se(t,e.appConfig.appName,!1),o={method:'POST',headers:n,body:JSON.stringify(i)};let s;try{const t=await fetch(re(e.appConfig),o);s=await t.json()}catch(e){throw C.create("token-subscribe-failed",{errorInfo:e?.toString()})}if(s.error){const e=s.error.message;throw C.create("token-subscribe-failed",{errorInfo:e})}if(!s.token)throw C.create("token-subscribe-no-token");return s.token}async function z(e,t){const n=await ae(e),i=se(t,e.appConfig.appName,!0),o={method:'POST',headers:n,body:JSON.stringify(i)};let s,c;try{s=await ie(()=>fetch(re(e.appConfig),o),J,Q)}catch(e){throw C.create("fid-registration-failed",{errorInfo:e?.toString()})}if(s.ok){return{responseFid:await Z(s)}}try{c=await s.json()}catch(e){throw C.create("fid-registration-failed",{errorInfo:s.statusText})}const u=c.error?.message??s.statusText;throw C.create("fid-registration-failed",{errorInfo:u})}async function Y(e,t){const n={method:'DELETE',headers:await ae(e)};let i;try{i=await fetch(`${re(e.appConfig)}/${t}`,n)}catch(e){throw C.create("fid-unregister-failed",{errorInfo:e?.toString()})}if(!i.ok)try{const e=await i.json();throw e.error?.message??i.statusText}catch(e){throw C.create("fid-unregister-failed",{errorInfo:'string'==typeof e&&e||i.statusText||e?.toString()})}}async function Z(e){const t=await e.text();if(!t.trim())throw C.create("fid-registration-failed",{errorInfo:'CreateRegistration succeeded but response body is empty'});let n;try{n=JSON.parse(t)}catch{throw C.create("fid-registration-failed",{errorInfo:'CreateRegistration succeeded but response body is not valid JSON'})}const i=n.name;if('string'!=typeof i||0===i.length)throw C.create("fid-registration-failed",{errorInfo:'CreateRegistration succeeded but response did not include a non-empty name'});return ee(i)}const X='/registrations/';function ee(e){const t=e.indexOf(X);if(-1!==t){const n=e.slice(t+X.length);if(n.length>0)return n}throw C.create("fid-registration-failed",{errorInfo:'CreateRegistration succeeded but response name is not a valid registration resource name'})}async function te(e,t){const n=await ae(e),i=se(t.subscriptionOptions,e.appConfig.appName,!1),o={method:'PATCH',headers:n,body:JSON.stringify(i)};let s;try{const n=await fetch(`${re(e.appConfig)}/${t.token}`,o);s=await n.json()}catch(e){throw C.create("token-update-failed",{errorInfo:e?.toString()})}if(s.error){const e=s.error.message;throw C.create("token-update-failed",{errorInfo:e})}if(!s.token)throw C.create("token-update-no-token");return s.token}async function ne(e,t){const n={method:'DELETE',headers:await ae(e)};try{const i=await fetch(`${re(e.appConfig)}/${t}`,n),o=await i.json();if(o.error){const e=o.error.message;throw C.create("token-unsubscribe-failed",{errorInfo:e})}}catch(e){throw C.create("token-unsubscribe-failed",{errorInfo:e?.toString()})}}async function ie(e,t,n){let i;for(let o=0;o<t;o++)try{return await e()}catch(e){if(i=e,o<t-1){const e=n*Math.pow(2,o);await new Promise(t=>setTimeout(t,e))}}throw i}function re({projectId:e}){return`${f}/projects/${e}/registrations`}async function ae({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({'Content-Type':'application/json',Accept:'application/json','x-goog-api-key':e.apiKey,'x-goog-firebase-installations-auth':`FIS ${n}`})}function oe(e,t){try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e))return new URL(e).host}catch{}try{if('undefined'!=typeof self&&self.location?.href)return new URL(e,self.location.origin).host}catch{}return'undefined'!=typeof self&&self.location?.host?self.location.host:t}function se({p256dh:e,auth:t,endpoint:n,vapidKey:i,swScope:o},s,c){const f={web:{origin:oe(o,s),endpoint:n,auth:t,p256dh:e}};return c&&(f.fcm_sdk_version=G),i!==u&&(f.web.applicationPubKey=i),f}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const ce=6048e5;async function de(e){const t=await we(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:b(t.getKey('auth')),p256dh:b(t.getKey('p256dh'))},i=await x(e.firebaseDependencies);if(i){if(he(i.subscriptionOptions,n))return Date.now()>=i.createTime+ce?le(e,{token:i.token,createTime:Date.now(),subscriptionOptions:n}):i.token;try{await ne(e.firebaseDependencies,i.token)}catch(e){console.warn(e)}return ge(e.firebaseDependencies,n)}return ge(e.firebaseDependencies,n)}async function ue(e,t){await ne(e.firebaseDependencies,t.token),await U(e.firebaseDependencies),await be(e.firebaseDependencies)}async function fe(e){const t=await B(e.firebaseDependencies).catch(()=>{}),n=t?.fid;n&&await Y(e.firebaseDependencies,n),await be(e.firebaseDependencies),n&&me(e,n)}async function pe(e){const t=await x(e.firebaseDependencies);t?await ue(e,t):await fe(e);const n=await e.swRegistration.pushManager.getSubscription();return!n||n.unsubscribe()}async function le(e,t){try{const n=await te(e.firebaseDependencies,t),i={...t,token:n,createTime:Date.now()};return await F(e.firebaseDependencies,i),n}catch(e){throw e}}async function ge(e,t){const n={token:await q(e,t),createTime:Date.now(),subscriptionOptions:t};return await F(e,n),n.token}async function we(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:y(t)})}function he(e,t){const n=t.vapidKey===e.vapidKey,i=t.endpoint===e.endpoint,o=t.auth===e.auth,s=t.p256dh===e.p256dh;return n&&i&&o&&s}async function be(e){try{await W(e)}catch{}}function ye(e,t){const n=e.onRegisteredHandler;n&&('function'==typeof n?n(t):n.next(t))}function me(e,t){const n=e.onUnregisteredHandler;n&&('function'==typeof n?n(t):n.next(t))}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function ve(e){try{e.swRegistration=await navigator.serviceWorker.register(s,{scope:c}),e.swRegistration.update().catch(()=>{}),await Ie(e.swRegistration)}catch(e){throw C.create("failed-service-worker-registration",{browserErrorMessage:e?.message})}}async function Ie(e){return new Promise((t,n)=>{const i=setTimeout(()=>n(new Error(`Service worker not registered after ${l} ms`)),l),o=e.installing||e.waiting;e.active?(clearTimeout(i),t()):o?o.onstatechange=e=>{'activated'===e.target?.state&&(o.onstatechange=null,clearTimeout(i),t())}:(clearTimeout(i),n(new Error('No incoming service worker found.')))})}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function ke(e,t){if(t||e.swRegistration||await ve(e),t||!e.swRegistration){if(!(t instanceof ServiceWorkerRegistration))throw C.create("invalid-sw-registration");e.swRegistration=t}}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function De(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=u)}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const Se=3;async function Te(e,t){const n=await Ce(e.swRegistration,e.vapidKey),i={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:n.endpoint,auth:b(n.getKey('auth')),p256dh:b(n.getKey('p256dh'))},o=e.firebaseDependencies.installations;for(let n=0;n<Se;n++){const{responseFid:s}=await z(e.firebaseDependencies,i);if(s===t)return;n<2&&await o.getToken(!0)}throw C.create("fid-registration-failed",{errorInfo:'CreateRegistration response FID does not match Firebase Installation ID'})}async function Ce(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:y(t)})}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const Oe=6048e5;async function Re(e,t){if(!navigator)throw C.create("only-available-in-window");if('default'===Notification.permission&&await Notification.requestPermission(),'granted'!==Notification.permission)throw C.create("permission-blocked");if(!e.onRegisteredHandler)throw C.create("invalid-on-registered-handler");await De(e,t?.vapidKey),await ke(e,t?.serviceWorkerRegistration);const n=e._registerNotifyChain.catch(()=>{});return e._registerNotifyChain=n.then(async()=>{const t=await e.firebaseDependencies.installations.getId(),n=await B(e.firebaseDependencies),i=Date.now();(!n||n.fid!==t||i>=n.lastRegisterTime+Oe)&&(await Te(e,t),await $(e.firebaseDependencies,{fid:t,lastRegisterTime:i,vapidKey:e.vapidKey}));if(!e.onRegisteredHandler)throw C.create("invalid-on-registered-handler");ye(e,t)}),e._registerNotifyChain}
/**
   * @license
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Me(t,n){return(0,e.onIdChange)(n,()=>{(async()=>{if(!t.onRegisteredHandler)return;await B(t.firebaseDependencies)&&await Re(t).catch(()=>{})})()})}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Pe(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Ke(t,e),je(t,e),Ee(t,e),t}function Ke(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const i=t.notification.body;i&&(e.notification.body=i);const o=t.notification.image;o&&(e.notification.image=o);const s=t.notification.icon;s&&(e.notification.icon=s)}function je(e,t){t.data&&(e.data=t.data)}function Ee(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const i=t.fcmOptions?.analytics_label;i&&(e.fcmOptions.analyticsLabel=i)}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function Ne(e){if(!e||!e.options)throw Ae('App Configuration Object');if(!e.name)throw Ae('App Name');const t=['projectId','apiKey','appId','messagingSenderId'],{options:n}=e;for(const e of t)if(!n[e])throw Ae(e);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function Ae(e){return C.create("missing-app-config-values",{valueName:e})}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class He{constructor(e,t,n){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:'stopped'};const i=Ne(e);this.firebaseDependencies={app:e,appConfig:i,installations:t,analyticsProvider:n}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),'scheduled'===this.logQueue.state&&clearTimeout(this.logQueue.timerId),this.logQueue={state:'stopped'},Promise.resolve()}}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function xe(e,t){if(!navigator)throw C.create("only-available-in-window");if('default'===Notification.permission&&await Notification.requestPermission(),'granted'!==Notification.permission)throw C.create("permission-blocked");return await De(e,t?.vapidKey),await ke(e,t?.serviceWorkerRegistration),de(e)}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function Fe(e,t,n){const i=Ue(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(i,{message_id:n[p],message_name:n["google.c.a.c_l"],message_time:n["google.c.a.ts"],message_device_time:Math.floor(Date.now()/1e3)})}function Ue(e){switch(e){case h.NOTIFICATION_CLICKED:return'notification_open';case h.PUSH_RECEIVED:return'notification_foreground';default:throw new Error}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function Be(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;if(e.onMessageHandler&&n.messageType===h.PUSH_RECEIVED&&('function'==typeof e.onMessageHandler?e.onMessageHandler(Pe(n)):e.onMessageHandler.next(Pe(n))),e.onRegisteredHandler&&n.messageType===h.FID_REGISTERED){const t=n.fid;'function'==typeof e.onRegisteredHandler?e.onRegisteredHandler(t):e.onRegisteredHandler.next(t)}const i=n.data;var o;'object'==typeof(o=i)&&o&&p in o&&'1'===i["google.c.a.e"]&&await Fe(e,n.messageType,i)}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const $e=e=>{const t=new He(e.getProvider('app').getImmediate(),e.getProvider('installations-internal').getImmediate(),e.getProvider('analytics-internal'));return navigator.serviceWorker.addEventListener('message',e=>Be(t,e)),t._fidChangeUnsubscribe=Me(t,e.getProvider('installations').getImmediate()),t},We=e=>{const t=e.getProvider('messaging').getImmediate();return{getToken:e=>xe(t,e),register:e=>Re(t,e)}};
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
async function Le(){try{await(0,i.validateIndexedDBOpenable)()}catch(e){return!1}return'undefined'!=typeof window&&(0,i.isIndexedDBAvailable)()&&(0,i.areCookiesEnabled)()&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window&&'fetch'in window&&ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification')&&PushSubscription.prototype.hasOwnProperty('getKey')}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function Ve(e){if(!navigator)throw C.create("only-available-in-window");return e.swRegistration||await ve(e),pe(e)}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Ge(e,t){if(!navigator)throw C.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Je(e,t){return e.onRegisteredHandler=t,()=>{e.onRegisteredHandler===t&&(e.onRegisteredHandler=null)}}
/**
   * @license
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Qe(e,t){return e.onUnregisteredHandler=t,()=>{e.onUnregisteredHandler===t&&(e.onUnregisteredHandler=null)}}
/**
   * @license
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function qe(e){if(!navigator)throw C.create("only-available-in-window");const t=await B(e.firebaseDependencies).catch(()=>{}),n=t?.fid??await e.firebaseDependencies.installations.getId();await Y(e.firebaseDependencies,n);try{await W(e.firebaseDependencies)}catch{}try{await U(e.firebaseDependencies)}catch{}const i=e.onUnregisteredHandler;i&&('function'==typeof i?i(n):i.next(n))}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ze(e=(0,o.getApp)()){return Le().then(e=>{if(!e)throw C.create("unsupported-browser")},e=>{throw C.create("indexed-db-unsupported")}),(0,o._getProvider)((0,i.getModularInstance)(e),'messaging').getImmediate()}async function Ye(e,t){return xe(e=(0,i.getModularInstance)(e),t)}function Ze(e){return Ve(e=(0,i.getModularInstance)(e))}function Xe(e,t){return Ge(e=(0,i.getModularInstance)(e),t)}async function et(e,t){return Re(e=(0,i.getModularInstance)(e),t)}async function tt(e){return qe(e=(0,i.getModularInstance)(e))}function nt(e,t){return Je(e=(0,i.getModularInstance)(e),t)}function it(e,t){return Qe(e=(0,i.getModularInstance)(e),t)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */(0,o._registerComponent)(new t.Component('messaging',$e,"PUBLIC")),(0,o._registerComponent)(new t.Component('messaging-internal',We,"PRIVATE")),(0,o.registerVersion)(V,G),(0,o.registerVersion)(V,G,'esm2020')},1683,[1684,1677,1687,1678,1676]);
__d(function(g,r,i,a,m,_e,d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"deleteInstallations",{enumerable:!0,get:function(){return vt}}),Object.defineProperty(_e,"getId",{enumerable:!0,get:function(){return gt}}),Object.defineProperty(_e,"getInstallations",{enumerable:!0,get:function(){return St}}),Object.defineProperty(_e,"getToken",{enumerable:!0,get:function(){return wt}}),Object.defineProperty(_e,"onIdChange",{enumerable:!0,get:function(){return Ct}});var t=r(d[0]),e=r(d[1]),n=r(d[2]),o=r(d[3]);const s="@firebase/installations",u="0.6.23",c=1e4,f=`w:${u}`,p='FIS_v2',l='https://firebaseinstallations.googleapis.com/v1',w=36e5,h={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":'Firebase Installation is not registered.',"installation-not-found":'Firebase Installation not found.',"request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":'Could not process request. Application offline.',"delete-pending-registration":"Can't delete installation while there is a pending registration request."},y=new n.ErrorFactory('installations','Installations',h);function v(t){return t instanceof n.FirebaseError&&t.code.includes("request-failed")}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function C({projectId:t}){return`${l}/projects/${t}/installations`}function S(t){return{token:t.token,requestStatus:2,expiresIn:(e=t.expiresIn,Number(e.replace('s','000'))),creationTime:Date.now()};var e}async function b(t,e){const n=(await e.json()).error;return y.create("request-failed",{requestName:t,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function I({apiKey:t}){return new Headers({'Content-Type':'application/json',Accept:'application/json','x-goog-api-key':t})}function T(t,{refreshToken:e}){const n=I(t);return n.append('Authorization',P(e)),n}async function k(t){const e=await t();return e.status>=500&&e.status<600?t():e}function P(t){return`${p} ${t}`}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function j({appConfig:t,heartbeatServiceProvider:e},{fid:n}){const o=C(t),s=I(t),u=e.getImmediate({optional:!0});if(u){const t=await u.getHeartbeatsHeader();t&&s.append('x-firebase-client',t)}const c={fid:n,authVersion:p,appId:t.appId,sdkVersion:f},l={method:'POST',headers:s,body:JSON.stringify(c)},w=await k(()=>fetch(o,l));if(w.ok){const t=await w.json();return{fid:t.fid||n,registrationStatus:2,refreshToken:t.refreshToken,authToken:S(t.authToken)}}throw await b('Create Installation',w)}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function q(t){return new Promise(e=>{setTimeout(e,t)})}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
const $=/^[cdef][\w-]{21}$/,E='';function D(){try{const t=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(t),t[0]=112+t[0]%16;const e=_(t);return $.test(e)?e:E}catch{return E}}function _(t){var e;return(e=t,btoa(String.fromCharCode(...e)).replace(/\+/g,'-').replace(/\//g,'_')).substr(0,22)}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function O(t){return`${t.appName}!${t.appId}`}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const A=new Map;function N(t,e){const n=O(t);x(n,e),M(n,e)}function F(t,e){L();const n=O(t);let o=A.get(n);o||(o=new Set,A.set(n,o)),o.add(e)}function V(t,e){const n=O(t),o=A.get(n);o&&(o.delete(e),0===o.size&&A.delete(n),B())}function x(t,e){const n=A.get(t);if(n)for(const t of n)t(e)}function M(t,e){const n=L();n&&n.postMessage({key:t,fid:e}),B()}let H=null;function L(){return!H&&'BroadcastChannel'in self&&(H=new BroadcastChannel('[Firebase] FID Change'),H.onmessage=t=>{x(t.data.key,t.data.fid)}),H}function B(){0===A.size&&H&&(H.close(),H=null)}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const K='firebase-installations-database',z=1,J='firebase-installations-store';let R=null;function U(){return R||(R=(0,o.openDB)(K,z,{upgrade:(t,e)=>{if(0===e)t.createObjectStore(J)}})),R}async function G(t,e){const n=O(t),o=(await U()).transaction(J,'readwrite'),s=o.objectStore(J),u=await s.get(n);return await s.put(e,n),await o.done,u&&u.fid===e.fid||N(t,e.fid),e}async function Q(t){const e=O(t),n=(await U()).transaction(J,'readwrite');await n.objectStore(J).delete(e),await n.done}async function W(t,e){const n=O(t),o=(await U()).transaction(J,'readwrite'),s=o.objectStore(J),u=await s.get(n),c=e(u);return void 0===c?await s.delete(n):await s.put(c,n),await o.done,!c||u&&u.fid===c.fid||N(t,c.fid),c}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function X(t){let e;const n=await W(t.appConfig,n=>{const o=Y(n),s=Z(t,o);return e=s.registrationPromise,s.installationEntry});return n.fid===E?{installationEntry:await e}:{installationEntry:n,registrationPromise:e}}function Y(t){return at(t||{fid:D(),registrationStatus:0})}function Z(t,e){if(0===e.registrationStatus){if(!navigator.onLine){return{installationEntry:e,registrationPromise:Promise.reject(y.create("app-offline"))}}const n={fid:e.fid,registrationStatus:1,registrationTime:Date.now()};return{installationEntry:n,registrationPromise:tt(t,n)}}return 1===e.registrationStatus?{installationEntry:e,registrationPromise:et(t)}:{installationEntry:e}}async function tt(t,e){try{const n=await j(t,e);return G(t.appConfig,n)}catch(n){throw v(n)&&409===n.customData.serverCode?await Q(t.appConfig):await G(t.appConfig,{fid:e.fid,registrationStatus:0}),n}}async function et(t){let e=await nt(t.appConfig);for(;1===e.registrationStatus;)await q(100),e=await nt(t.appConfig);if(0===e.registrationStatus){const{installationEntry:e,registrationPromise:n}=await X(t);return n||e}return e}function nt(t){return W(t,t=>{if(!t)throw y.create("installation-not-found");return at(t)})}function at(t){return 1===(e=t).registrationStatus&&e.registrationTime+c<Date.now()?{fid:t.fid,registrationStatus:0}:t;var e;
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */}async function it({appConfig:t,heartbeatServiceProvider:e},n){const o=rt(t,n),s=T(t,n),u=e.getImmediate({optional:!0});if(u){const t=await u.getHeartbeatsHeader();t&&s.append('x-firebase-client',t)}const c={installation:{sdkVersion:f,appId:t.appId}},p={method:'POST',headers:s,body:JSON.stringify(c)},l=await k(()=>fetch(o,p));if(l.ok){return S(await l.json())}throw await b('Generate Auth Token',l)}function rt(t,{fid:e}){return`${C(t)}/${e}/authTokens:generate`}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function ot(t,e=!1){let n;const o=await W(t.appConfig,o=>{if(!ft(o))throw y.create("not-registered");const s=o.authToken;if(!e&&pt(s))return o;if(1===s.requestStatus)return n=st(t,e),o;{if(!navigator.onLine)throw y.create("app-offline");const e=dt(o);return n=ct(t,e),e}});return n?await n:o.authToken}async function st(t,e){let n=await ut(t.appConfig);for(;1===n.authToken.requestStatus;)await q(100),n=await ut(t.appConfig);const o=n.authToken;return 0===o.requestStatus?ot(t,e):o}function ut(t){return W(t,t=>{if(!ft(t))throw y.create("not-registered");const e=t.authToken;return 1===(n=e).requestStatus&&n.requestTime+c<Date.now()?{...t,authToken:{requestStatus:0}}:t;var n;
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */})}async function ct(t,e){try{const n=await it(t,e),o={...e,authToken:n};return await G(t.appConfig,o),n}catch(n){if(!v(n)||401!==n.customData.serverCode&&404!==n.customData.serverCode){const n={...e,authToken:{requestStatus:0}};await G(t.appConfig,n)}else await Q(t.appConfig);throw n}}function ft(t){return void 0!==t&&2===t.registrationStatus}function pt(t){return 2===t.requestStatus&&!lt(t)}function lt(t){const e=Date.now();return e<t.creationTime||t.creationTime+t.expiresIn<e+w}function dt(t){return{...t,authToken:{requestStatus:1,requestTime:Date.now()}}}async function gt(t){const e=t,{installationEntry:n,registrationPromise:o}=await X(e);return o?o.catch(console.error):ot(e).catch(console.error),n.fid}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function wt(t,e=!1){const n=t;await mt(n);return(await ot(n,e)).token}async function mt(t){const{registrationPromise:e}=await X(t);e&&await e}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function ht(t,e){const n=yt(t,e),o={method:'DELETE',headers:T(t,e)},s=await k(()=>fetch(n,o));if(!s.ok)throw await b('Delete Installation',s)}function yt(t,{fid:e}){return`${C(t)}/${e}`}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function vt(t){const{appConfig:e}=t,n=await W(e,t=>{if(!t||0!==t.registrationStatus)return t});if(n){if(1===n.registrationStatus)throw y.create("delete-pending-registration");if(2===n.registrationStatus){if(!navigator.onLine)throw y.create("app-offline");await ht(e,n),await Q(e)}}}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Ct(t,e){const{appConfig:n}=t;return F(n,e),()=>{V(n,e)}}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function St(e=(0,t.getApp)()){return(0,t._getProvider)(e,'installations').getImmediate()}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function bt(t){if(!t||!t.options)throw It('App Configuration');if(!t.name)throw It('App Name');const e=['projectId','apiKey','appId'];for(const n of e)if(!t.options[n])throw It(n);return{appName:t.name,projectId:t.options.projectId,apiKey:t.options.apiKey,appId:t.options.appId}}function It(t){return y.create("missing-app-config-values",{valueName:t})}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const Tt='installations',kt=e=>{const n=e.getProvider('app').getImmediate();return{app:n,appConfig:bt(n),heartbeatServiceProvider:(0,t._getProvider)(n,'heartbeat'),_delete:()=>Promise.resolve()}},Pt=e=>{const n=e.getProvider('app').getImmediate(),o=(0,t._getProvider)(n,Tt).getImmediate();return{getId:()=>gt(o),getToken:t=>wt(o,t)}};(0,t._registerComponent)(new e.Component(Tt,kt,"PUBLIC")),(0,t._registerComponent)(new e.Component("installations-internal",Pt,"PRIVATE")),(0,t.registerVersion)(s,u),(0,t.registerVersion)(s,u,'esm2020')},1684,[1676,1677,1678,1685]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"unwrap",{enumerable:!0,get:function(){return n.u}}),Object.defineProperty(e,"wrap",{enumerable:!0,get:function(){return n.w}}),Object.defineProperty(e,"deleteDB",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"openDB",{enumerable:!0,get:function(){return t}});var n=r(d[0]);function t(t,o,{blocked:s,upgrade:c,blocking:u,terminated:l}={}){const f=indexedDB.open(t,o),b=(0,n.w)(f);return c&&f.addEventListener('upgradeneeded',t=>{c((0,n.w)(f.result),t.oldVersion,t.newVersion,(0,n.w)(f.transaction),t)}),s&&f.addEventListener('blocked',n=>s(n.oldVersion,n.newVersion,n)),b.then(n=>{l&&n.addEventListener('close',()=>l()),u&&n.addEventListener('versionchange',n=>u(n.oldVersion,n.newVersion,n))}).catch(()=>{}),b}function o(t,{blocked:o}={}){const s=indexedDB.deleteDatabase(t);return o&&s.addEventListener('blocked',n=>o(n.oldVersion,n)),(0,n.w)(s).then(()=>{})}const s=['get','getKey','getAll','getAllKeys','count'],c=['put','add','delete','clear'],u=new Map;function l(n,t){if(!(n instanceof IDBDatabase)||t in n||'string'!=typeof t)return;if(u.get(t))return u.get(t);const o=t.replace(/FromIndex$/,''),l=t!==o,f=c.includes(o);if(!(o in(l?IDBIndex:IDBObjectStore).prototype)||!f&&!s.includes(o))return;const b=async function(n,...t){const s=this.transaction(n,f?'readwrite':'readonly');let c=s.store;return l&&(c=c.index(t.shift())),(await Promise.all([c[o](...t),f&&s.done]))[0]};return u.set(t,b),b}(0,n.r)(n=>({...n,get:(t,o,s)=>l(t,o)||n.get(t,o,s),has:(t,o)=>!!l(t,o)||n.has(t,o)}))},1685,[1686]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"a",{enumerable:!0,get:function(){return p}}),Object.defineProperty(e,"i",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"r",{enumerable:!0,get:function(){return l}}),Object.defineProperty(e,"u",{enumerable:!0,get:function(){return B}}),Object.defineProperty(e,"w",{enumerable:!0,get:function(){return I}});const t=(t,n)=>n.some(n=>t instanceof n);let n,o;const s=new WeakMap,c=new WeakMap,u=new WeakMap,f=new WeakMap,p=new WeakMap;function b(t){const n=new Promise((n,o)=>{const s=()=>{t.removeEventListener('success',c),t.removeEventListener('error',u)},c=()=>{n(I(t.result)),s()},u=()=>{o(t.error),s()};t.addEventListener('success',c),t.addEventListener('error',u)});return n.then(n=>{n instanceof IDBCursor&&s.set(n,t)}).catch(()=>{}),p.set(n,t),n}function v(t){if(c.has(t))return;const n=new Promise((n,o)=>{const s=()=>{t.removeEventListener('complete',c),t.removeEventListener('error',u),t.removeEventListener('abort',u)},c=()=>{n(),s()},u=()=>{o(t.error||new DOMException('AbortError','AbortError')),s()};t.addEventListener('complete',c),t.addEventListener('error',u),t.addEventListener('abort',u)});c.set(t,n)}let D={get(t,n,o){if(t instanceof IDBTransaction){if('done'===n)return c.get(t);if('objectStoreNames'===n)return t.objectStoreNames||u.get(t);if('store'===n)return o.objectStoreNames[1]?void 0:o.objectStore(o.objectStoreNames[0])}return I(t[n])},set:(t,n,o)=>(t[n]=o,!0),has:(t,n)=>t instanceof IDBTransaction&&('done'===n||'store'===n)||n in t};function l(t){D=t(D)}function y(c){return'function'==typeof c?(f=c)!==IDBDatabase.prototype.transaction||'objectStoreNames'in IDBTransaction.prototype?(o||(o=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(f)?function(...t){return f.apply(B(this),t),I(s.get(this))}:function(...t){return I(f.apply(B(this),t))}:function(t,...n){const o=f.call(B(this),t,...n);return u.set(o,t.sort?t.sort():[t]),I(o)}:(c instanceof IDBTransaction&&v(c),t(c,n||(n=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction]))?new Proxy(c,D):c);var f}function I(t){if(t instanceof IDBRequest)return b(t);if(f.has(t))return f.get(t);const n=y(t);return n!==t&&(f.set(t,n),p.set(n,t)),n}const B=t=>p.get(t)},1686,[]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"unwrap",{enumerable:!0,get:function(){return n.u}}),Object.defineProperty(e,"wrap",{enumerable:!0,get:function(){return n.w}}),Object.defineProperty(e,"deleteDB",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"openDB",{enumerable:!0,get:function(){return t}});var n=r(d[0]);function t(t,o,{blocked:s,upgrade:c,blocking:u,terminated:l}={}){const f=indexedDB.open(t,o),b=(0,n.w)(f);return c&&f.addEventListener('upgradeneeded',t=>{c((0,n.w)(f.result),t.oldVersion,t.newVersion,(0,n.w)(f.transaction),t)}),s&&f.addEventListener('blocked',n=>s(n.oldVersion,n.newVersion,n)),b.then(n=>{l&&n.addEventListener('close',()=>l()),u&&n.addEventListener('versionchange',n=>u(n.oldVersion,n.newVersion,n))}).catch(()=>{}),b}function o(t,{blocked:o}={}){const s=indexedDB.deleteDatabase(t);return o&&s.addEventListener('blocked',n=>o(n.oldVersion,n)),(0,n.w)(s).then(()=>{})}const s=['get','getKey','getAll','getAllKeys','count'],c=['put','add','delete','clear'],u=new Map;function l(n,t){if(!(n instanceof IDBDatabase)||t in n||'string'!=typeof t)return;if(u.get(t))return u.get(t);const o=t.replace(/FromIndex$/,''),l=t!==o,f=c.includes(o);if(!(o in(l?IDBIndex:IDBObjectStore).prototype)||!f&&!s.includes(o))return;const b=async function(n,...t){const s=this.transaction(n,f?'readwrite':'readonly');let c=s.store;return l&&(c=c.index(t.shift())),(await Promise.all([c[o](...t),f&&s.done]))[0]};return u.set(t,b),b}(0,n.r)(n=>({...n,get:(t,o,s)=>l(t,o)||n.get(t,o,s),has:(t,o)=>!!l(t,o)||n.has(t,o)}))},1687,[1688]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"a",{enumerable:!0,get:function(){return p}}),Object.defineProperty(e,"i",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"r",{enumerable:!0,get:function(){return l}}),Object.defineProperty(e,"u",{enumerable:!0,get:function(){return B}}),Object.defineProperty(e,"w",{enumerable:!0,get:function(){return I}});const t=(t,n)=>n.some(n=>t instanceof n);let n,o;const s=new WeakMap,c=new WeakMap,u=new WeakMap,f=new WeakMap,p=new WeakMap;function b(t){const n=new Promise((n,o)=>{const s=()=>{t.removeEventListener('success',c),t.removeEventListener('error',u)},c=()=>{n(I(t.result)),s()},u=()=>{o(t.error),s()};t.addEventListener('success',c),t.addEventListener('error',u)});return n.then(n=>{n instanceof IDBCursor&&s.set(n,t)}).catch(()=>{}),p.set(n,t),n}function v(t){if(c.has(t))return;const n=new Promise((n,o)=>{const s=()=>{t.removeEventListener('complete',c),t.removeEventListener('error',u),t.removeEventListener('abort',u)},c=()=>{n(),s()},u=()=>{o(t.error||new DOMException('AbortError','AbortError')),s()};t.addEventListener('complete',c),t.addEventListener('error',u),t.addEventListener('abort',u)});c.set(t,n)}let D={get(t,n,o){if(t instanceof IDBTransaction){if('done'===n)return c.get(t);if('objectStoreNames'===n)return t.objectStoreNames||u.get(t);if('store'===n)return o.objectStoreNames[1]?void 0:o.objectStore(o.objectStoreNames[0])}return I(t[n])},set:(t,n,o)=>(t[n]=o,!0),has:(t,n)=>t instanceof IDBTransaction&&('done'===n||'store'===n)||n in t};function l(t){D=t(D)}function y(c){return'function'==typeof c?(f=c)!==IDBDatabase.prototype.transaction||'objectStoreNames'in IDBTransaction.prototype?(o||(o=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(f)?function(...t){return f.apply(B(this),t),I(s.get(this))}:function(...t){return I(f.apply(B(this),t))}:function(t,...n){const o=f.call(B(this),t,...n);return u.set(o,t.sort?t.sort():[t]),I(o)}:(c instanceof IDBTransaction&&v(c),t(c,n||(n=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction]))?new Proxy(c,D):c);var f}function I(t){if(t instanceof IDBRequest)return b(t);if(f.has(t))return f.get(t);const n=y(t);return n!==t&&(f.set(t,n),p.set(n,t)),n}const B=t=>p.get(t)},1688,[]);