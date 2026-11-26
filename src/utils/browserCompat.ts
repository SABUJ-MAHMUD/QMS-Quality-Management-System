/**
 * Cross-browser ES2022-ES2025 compatibility polyfills for older desktop/mobile browsers
 * (e.g. Chrome 88-140, Edge 88-140, Firefox 85-133, Safari 14-18.3, older WebViews).
 *
 * Primarily required by modern dependencies such as `pdfjs-dist` v6+ which reference
 * `Iterator.prototype.join`, `Promise.try`, `Promise.withResolvers`, `URL.parse`,
 * `Uint8Array.fromBase64`, `Uint8Array.prototype.toBase64`, `Uint8Array.prototype.toHex`,
 * `Object.hasOwn`, and `structuredClone`.
 */

export const BROWSER_COMPAT_POLYFILL_IIFE = `(function(g){
  try{
    if(!g){return;}
    if(typeof g.Iterator==='undefined'){
      g.Iterator=function Iterator(){};
    }
    if(g.Iterator&&g.Iterator.prototype&&typeof g.Iterator.prototype.join!=='function'){
      Object.defineProperty(g.Iterator.prototype,'join',{
        value:function(separator){
          var sep=separator===undefined?',':String(separator);
          return Array.from(this).join(sep);
        },
        configurable:true,
        writable:true
      });
    }
    if(g.Iterator&&typeof g.Iterator.from!=='function'){
      Object.defineProperty(g.Iterator,'from',{
        value:function(iterable){
          if(iterable&&typeof Symbol!=='undefined'&&typeof iterable[Symbol.iterator]==='function'){
            return iterable[Symbol.iterator]();
          }
          return iterable;
        },
        configurable:true,
        writable:true
      });
    }
    if(typeof g.Promise==='function'){
      if(typeof g.Promise.withResolvers!=='function'){
        g.Promise.withResolvers=function(){
          var resolve,reject;
          var promise=new g.Promise(function(res,rej){resolve=res;reject=rej;});
          return{promise:promise,resolve:resolve,reject:reject};
        };
      }
      if(typeof g.Promise.try!=='function'){
        g.Promise.try=function(fn){
          var args=Array.prototype.slice.call(arguments,1);
          return new g.Promise(function(resolve){
            resolve(fn.apply(undefined,args));
          });
        };
      }
    }
    if(typeof g.URL==='function'){
      if(typeof g.URL.parse!=='function'){
        g.URL.parse=function(url,base){
          try{
            return arguments.length>1&&base!==undefined?new g.URL(url,base):new g.URL(url);
          }catch(e){
            return null;
          }
        };
      }
      if(typeof g.URL.canParse!=='function'){
        g.URL.canParse=function(url,base){
          return g.URL.parse(url,base)!==null;
        };
      }
    }
    if(typeof Object.hasOwn!=='function'){
      Object.hasOwn=function(obj,prop){
        return Object.prototype.hasOwnProperty.call(obj,prop);
      };
    }
    if(!Array.prototype.at){
      Object.defineProperty(Array.prototype,'at',{
        value:function(n){
          n=Math.trunc(n)||0;
          if(n<0)n+=this.length;
          if(n<0||n>=this.length)return undefined;
          return this[n];
        },
        configurable:true,
        writable:true
      });
    }
    if(!Array.prototype.findLast){
      Object.defineProperty(Array.prototype,'findLast',{
        value:function(predicate,thisArg){
          for(var i=this.length-1;i>=0;i--){
            if(predicate.call(thisArg,this[i],i,this))return this[i];
          }
          return undefined;
        },
        configurable:true,
        writable:true
      });
    }
    if(!Array.prototype.findLastIndex){
      Object.defineProperty(Array.prototype,'findLastIndex',{
        value:function(predicate,thisArg){
          for(var i=this.length-1;i>=0;i--){
            if(predicate.call(thisArg,this[i],i,this))return i;
          }
          return -1;
        },
        configurable:true,
        writable:true
      });
    }
    if(!Array.prototype.toSorted){
      Object.defineProperty(Array.prototype,'toSorted',{
        value:function(compareFn){
          return Array.prototype.slice.call(this).sort(compareFn);
        },
        configurable:true,
        writable:true
      });
    }
    if(!Array.prototype.toReversed){
      Object.defineProperty(Array.prototype,'toReversed',{
        value:function(){
          return Array.prototype.slice.call(this).reverse();
        },
        configurable:true,
        writable:true
      });
    }
    if(!String.prototype.at){
      Object.defineProperty(String.prototype,'at',{
        value:function(n){
          n=Math.trunc(n)||0;
          if(n<0)n+=this.length;
          if(n<0||n>=this.length)return undefined;
          return this.charAt(n);
        },
        configurable:true,
        writable:true
      });
    }
    if(!String.prototype.replaceAll){
      String.prototype.replaceAll=function(search,replacement){
        if(search instanceof RegExp){
          if(!search.global)throw new TypeError('replaceAll must be called with a global RegExp');
          return this.replace(search,replacement);
        }
        return this.split(search).join(replacement);
      };
    }
    if(typeof Uint8Array==='function'){
      if(typeof Uint8Array.fromBase64!=='function'&&typeof atob==='function'){
        Object.defineProperty(Uint8Array,'fromBase64',{
          value:function(b64){
            var normalized=String(b64).replace(/-/g,'+').replace(/_/g,'/').replace(/\\s+/g,'');
            var bin=atob(normalized);
            var bytes=new Uint8Array(bin.length);
            for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
            return bytes;
          },
          configurable:true,
          writable:true
        });
      }
      if(typeof Uint8Array.prototype.toBase64!=='function'&&typeof btoa==='function'){
        Object.defineProperty(Uint8Array.prototype,'toBase64',{
          value:function(){
            var chunks=[];
            for(var i=0;i<this.length;i+=0x8000){
              chunks.push(String.fromCharCode.apply(null,this.subarray(i,i+0x8000)));
            }
            return btoa(chunks.join(''));
          },
          configurable:true,
          writable:true
        });
      }
      if(typeof Uint8Array.prototype.toHex!=='function'){
        Object.defineProperty(Uint8Array.prototype,'toHex',{
          value:function(){
            var out='';
            for(var i=0;i<this.length;i++){
              var h=this[i].toString(16);
              out+=h.length===1?'0'+h:h;
            }
            return out;
          },
          configurable:true,
          writable:true
        });
      }
    }
    if(typeof g.structuredClone!=='function'){
      var cloneVal=function(val,seen){
        if(val===null||typeof val!=='object')return val;
        if(seen.has(val))return seen.get(val);
        if(val instanceof Date)return new Date(val.getTime());
        if(val instanceof RegExp)return new RegExp(val.source,val.flags);
        if(typeof ArrayBuffer!=='undefined'&&val instanceof ArrayBuffer)return val.slice(0);
        if(typeof ArrayBuffer!=='undefined'&&ArrayBuffer.isView(val)){
          return new val.constructor(val.buffer.slice(val.byteOffset,val.byteOffset+val.byteLength));
        }
        if(Array.isArray(val)){
          var arr=[];
          seen.set(val,arr);
          for(var i=0;i<val.length;i++)arr[i]=cloneVal(val[i],seen);
          return arr;
        }
        if(val instanceof Map){
          var m=new Map();
          seen.set(val,m);
          val.forEach(function(v,k){m.set(cloneVal(k,seen),cloneVal(v,seen));});
          return m;
        }
        if(val instanceof Set){
          var s=new Set();
          seen.set(val,s);
          val.forEach(function(v){s.add(cloneVal(v,seen));});
          return s;
        }
        var obj={};
        seen.set(val,obj);
        var keys=Object.keys(val);
        for(var j=0;j<keys.length;j++){
          obj[keys[j]]=cloneVal(val[keys[j]],seen);
        }
        return obj;
      };
      g.structuredClone=function(value){
        return cloneVal(value,new WeakMap());
      };
    }
    if(typeof g.crypto!=='undefined'&&!g.crypto.randomUUID){
      g.crypto.randomUUID=function(){
        return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,function(c){
          var r=(typeof g.crypto.getRandomValues==='function')
            ?(g.crypto.getRandomValues(new Uint8Array(1))[0]&(15>>(Number(c)/4)))
            :((Math.random()*16)|0);
          return(Number(c)^r).toString(16);
        });
      };
    }
  }catch(e){}
})(typeof globalThis!=='undefined'?globalThis:typeof self!=='undefined'?self:typeof window!=='undefined'?window:this);`;

/**
 * Runtime installer for main thread / dev mode / tests.
 */
export function ensureBrowserCompatPolyfills(target: any = typeof globalThis !== 'undefined' ? globalThis : window): void {
  if (!target) return;

  if (typeof target.Iterator === 'undefined') {
    target.Iterator = function Iterator() {};
  }
  if (target.Iterator?.prototype && typeof target.Iterator.prototype.join !== 'function') {
    Object.defineProperty(target.Iterator.prototype, 'join', {
      value: function join(this: Iterable<unknown>, separator?: string) {
        const sep = separator === undefined ? ',' : String(separator);
        return Array.from(this).join(sep);
      },
      configurable: true,
      writable: true,
    });
  }
  if (target.Iterator && typeof target.Iterator.from !== 'function') {
    Object.defineProperty(target.Iterator, 'from', {
      value: function from<T>(iterable: Iterable<T>) {
        if (iterable && typeof Symbol !== 'undefined' && typeof (iterable as any)[Symbol.iterator] === 'function') {
          return (iterable as any)[Symbol.iterator]();
        }
        return iterable;
      },
      configurable: true,
      writable: true,
    });
  }

  if (typeof target.Promise === 'function') {
    if (typeof target.Promise.withResolvers !== 'function') {
      target.Promise.withResolvers = function withResolvers<T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new target.Promise((res: typeof resolve, rej: typeof reject) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }
    if (typeof target.Promise.try !== 'function') {
      target.Promise.try = function promiseTry<T>(fn: (...args: any[]) => T, ...args: any[]) {
        return new target.Promise((resolve: (v: T) => void) => {
          resolve(fn(...args));
        });
      };
    }
  }

  if (typeof target.URL === 'function') {
    if (typeof target.URL.parse !== 'function') {
      target.URL.parse = function urlParse(url: string, base?: string) {
        try {
          return base !== undefined ? new target.URL(url, base) : new target.URL(url);
        } catch {
          return null;
        }
      };
    }
    if (typeof target.URL.canParse !== 'function') {
      target.URL.canParse = function urlCanParse(url: string, base?: string) {
        return target.URL.parse(url, base) !== null;
      };
    }
  }

  if (typeof Uint8Array === 'function') {
    if (typeof (Uint8Array as any).fromBase64 !== 'function' && typeof atob === 'function') {
      Object.defineProperty(Uint8Array, 'fromBase64', {
        value: function fromBase64(b64: string) {
          const normalized = String(b64).replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
          const bin = atob(normalized);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return bytes;
        },
        configurable: true,
        writable: true,
      });
    }
    if (typeof (Uint8Array.prototype as any).toBase64 !== 'function' && typeof btoa === 'function') {
      Object.defineProperty(Uint8Array.prototype, 'toBase64', {
        value: function toBase64(this: Uint8Array) {
          const chunks: string[] = [];
          for (let i = 0; i < this.length; i += 0x8000) {
            chunks.push(String.fromCharCode(...this.subarray(i, i + 0x8000)));
          }
          return btoa(chunks.join(''));
        },
        configurable: true,
        writable: true,
      });
    }
    if (typeof (Uint8Array.prototype as any).toHex !== 'function') {
      Object.defineProperty(Uint8Array.prototype, 'toHex', {
        value: function toHex(this: Uint8Array) {
          let out = '';
          for (let i = 0; i < this.length; i++) {
            const h = this[i].toString(16);
            out += h.length === 1 ? `0${h}` : h;
          }
          return out;
        },
        configurable: true,
        writable: true,
      });
    }
  }
}
