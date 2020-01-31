import * as THREE from 'three';
import {
  Vector2,
  Raycaster,
  Scene,
  OrthographicCamera,
  PerspectiveCamera,
  Vector3,
  MathUtils,
  
  PCFSoftShadowMap,
} from 'three';
import Reconciler from 'react-reconciler';
import {
  unstable_now,
  unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_runWithPriority,
  unstable_IdlePriority,
} from 'scheduler';
import {
  createContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  createElement,
  useLayoutEffect,
  useContext,
  useMemo,
  memo,
} from 'react';
import { GLView } from 'expo-gl';
import { PanResponder, PixelRatio } from 'react-native';
import { Renderer as Renderer$1 } from 'expo-three';






function _extends() {
  const __extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

  return __extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var version = '2.4.3';

function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, 'string');
  return typeof key === 'symbol' ? key : String(key);
}

function _toPrimitive(input, hint) {
  if (typeof input !== 'object' || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || 'default');
    if (typeof res !== 'object') return res;
    throw new TypeError('@@toPrimitive must return a primitive value.');
  }
  return (hint === 'string' ? String : Number)(input);
}
const roots = new Map();
const emptyObject = {};
const is = {
  obj: a => a === Object(a),
  str: a => typeof a === 'string',
  num: a => typeof a === 'number',
  und: a => a === void 0,
  arr: a => Array.isArray(a),

  equ(a, b) {
    // Wrong type, doesn't match
    if (typeof a !== typeof b) return false; // Atomic, just compare a against b

    if (is.str(a) || is.num(a) || is.obj(a)) return a === b; // Array, shallow compare first to see if it's a match

    if (is.arr(a) && a == b) return true; // Last resort, go through keys

    let i;

    for (i in a) if (!(i in b)) return false;

    for (i in b) if (a[i] !== b[i]) return false;

    return is.und(i) ? a === b : true;
  },
};
let globalEffects = [];
function addEffect(callback) {
  globalEffects.push(callback);
}
function renderGl(state, timestamp, repeat, runGlobalEffects) {
  if (repeat === void 0) {
    repeat = 0;
  }

  if (runGlobalEffects === void 0) {
    runGlobalEffects = false;
  }

  // Run global effects
  if (runGlobalEffects)
    globalEffects.forEach(effect => effect(timestamp) && repeat++); // Run local effects

  state.current.subscribers.forEach(fn => fn(state.current, timestamp)); // Decrease frame count

  state.current.frames = Math.max(0, state.current.frames - 1);
  repeat += !state.current.invalidateFrameloop ? 1 : state.current.frames; // Render content

  if (!state.current.manual && state.current.gl)
    state.current.gl.render(state.current.scene, state.current.camera);
  return repeat;
}
let running = false;

function renderLoop(timestamp) {
  running = true;
  let repeat = 0; // Run global effects

  globalEffects.forEach(effect => effect(timestamp) && repeat++);
  roots.forEach(root => {
    const state = root.containerInfo.__state; // If the frameloop is invalidated, do not run another frame

    if (
      state.current.active &&
      state.current.ready &&
      (!state.current.invalidateFrameloop || state.current.frames > 0)
    )
      repeat = renderGl(state, timestamp, repeat);
  });
  if (repeat !== 0) return requestAnimationFrame(renderLoop); // Flag end of operation

  running = false;
}

function invalidate(state, frames) {
  if (state === void 0) {
    state = true;
  }

  if (frames === void 0) {
    frames = 2;
  }

  if (state === true)
    roots.forEach(root => (root.containerInfo.__state.current.frames = frames));
  else if (state && state.current) {
    if (state.current.vr) return;
    state.current.frames = frames;
  }

  if (!running) {
    running = true;
    requestAnimationFrame(renderLoop);
  }
}
let catalogue = {};
const extend = objects => void (catalogue = _extends({}, catalogue, objects));
function applyProps(instance, newProps, oldProps, accumulative) {
  if (oldProps === void 0) {
    oldProps = {};
  }

  if (accumulative === void 0) {
    accumulative = false;
  }

  // Filter equals, events and reserved props
  const container = instance.__container;
  const sameProps = Object.keys(newProps).filter(key =>
    is.equ(newProps[key], oldProps[key])
  );
  const handlers = Object.keys(newProps).filter(
    key => typeof newProps[key] === 'function' && key.startsWith('on')
  );
  const leftOvers = accumulative
    ? Object.keys(oldProps).filter(key => newProps[key] === void 0)
    : [];
  const filteredProps = [...sameProps, 'children', 'key', 'ref'].reduce(
    (acc, prop) => {
      let _ = acc[prop],
        rest = _objectWithoutPropertiesLoose(acc, [prop].map(_toPropertyKey));

      return rest;
    },
    newProps
  ); // Add left-overs as undefined props so they can be removed

  leftOvers.forEach(key => (filteredProps[key] = undefined));

  if (Object.keys(filteredProps).length > 0) {
    Object.entries(filteredProps).forEach(_ref => {
      let key = _ref[0],
        value = _ref[1];

      if (!handlers.includes(key)) {
        let root = instance;
        let target = root[key];

        if (key.includes('-')) {
          const entries = key.split('-');
          target = entries.reduce((acc, key) => acc[key], instance); // If the target is atomic, it forces us to switch the root

          if (!(target && target.set)) {
            const _entries$reverse = entries.reverse(),
              name = _entries$reverse[0],
              reverseEntries = _entries$reverse.slice(1);

            root = reverseEntries
              .reverse()
              .reduce((acc, key) => acc[key], instance);
            key = name;
          }
        } // Special treatment for objects with support for set/copy

        if (target && target.set && target.copy) {
          if (target.constructor.name === value.constructor.name)
            target.copy(value);
          else if (Array.isArray(value)) target.set(...value);
          else target.set(value); // Else, just overwrite the value
        } else root[key] = value;

        invalidateInstance(instance);
      }
    }); // Preemptively delete the instance from the containers interaction

    if (accumulative && container && instance.raycast && instance.__handlers) {
      instance.__handlers = undefined;

      const index = container.__interaction.indexOf(instance);

      if (index > -1) container.__interaction.splice(index, 1);
    } // Prep interaction handlers

    if (handlers.length) {
      // Add interactive object to central container
      if (container && instance.raycast) {
        // Unless the only onUpdate is the only event present we flag the instance as interactive
        if (!(handlers.length === 1 && handlers[0] === 'onUpdate'))
          container.__interaction.push(instance);
      } // Add handlers to the instances handler-map

      instance.__handlers = handlers.reduce(
        (acc, key) =>
          _extends({}, acc, {
            [key.charAt(2).toLowerCase() + key.substr(3)]: newProps[key],
          }),
        {}
      );
    } // Call the update lifecycle when it is being updated, but only when it is part of the scene

    if (instance.parent) updateInstance(instance);
  }
}

function invalidateInstance(instance) {
  if (instance.__container && instance.__container.__state)
    invalidate(instance.__container.__state);
}

function updateInstance(instance) {
  if (instance.__handlers && instance.__handlers.update)
    instance.__handlers.update(instance);
}

function createInstance(type, _ref2, container) {
  let _ref2$args = _ref2.args,
    args = _ref2$args === void 0 ? [] : _ref2$args,
    props = _objectWithoutPropertiesLoose(_ref2, ['args']);

  let name = '' + type[0].toUpperCase() + type.slice(1);
  let instance;

  if (type === 'primitive') {
    instance = props.object;
    instance.__instance = true;
  } else {
    const target = catalogue[name] || THREE[name];
    instance = is.arr(args) ? new target(...args) : new target(args);
  } // Bind to the root container in case portals are being used
  // This is perhaps better for event management as we can keep them on a single instance

  while (container.__container) {
    container = container.__container;
  } // Apply initial props

  instance.__objects = [];
  instance.__container = container; // It should NOT call onUpdate on object instanciation, because it hasn't been added to the
  // view yet. If the callback relies on references for instance, they won't be ready yet, this is
  // why it passes "false" here

  applyProps(instance, props, {});
  return instance;
}

function appendChild(parentInstance, child) {
  if (child) {
    if (child.isObject3D) parentInstance.add(child);
    else {
      parentInstance.__objects.push(child);

      child.parent = parentInstance; // The attach attribute implies that the object attaches itself on the parent

      if (child.attach) parentInstance[child.attach] = child;
      else if (child.attachArray) {
        if (!is.arr(parentInstance[child.attachArray]))
          parentInstance[child.attachArray] = [];
        parentInstance[child.attachArray].push(child);
      } else if (child.attachObject) {
        if (!is.obj(parentInstance[child.attachObject[0]]))
          parentInstance[child.attachObject[0]] = {};
        parentInstance[child.attachObject[0]][child.attachObject[1]] = child;
      }
    }
    updateInstance(child);
    invalidateInstance(child);
  }
}

function insertBefore(parentInstance, child, beforeChild) {
  if (child) {
    if (child.isObject3D) {
      child.parent = parentInstance;
      child.dispatchEvent({
        type: 'added',
      }); // TODO: the order is out of whack if data objects are present, has to be recalculated

      const index = parentInstance.children.indexOf(beforeChild);
      parentInstance.children = [
        ...parentInstance.children.slice(0, index),
        child,
        ...parentInstance.children.slice(index),
      ];
      updateInstance(child);
    } else appendChild(parentInstance, child); // TODO: order!!!

    invalidateInstance(child);
  }
}

function removeRecursive(array, parent, clone) {
  if (clone === void 0) {
    clone = false;
  }

  if (array) {
    // Three uses splice op's internally we may have to shallow-clone the array in order to safely remove items
    const target = clone ? [...array] : array;
    target.forEach(child => removeChild(parent, child));
  }
}

function removeChild(parentInstance, child) {
  if (child) {
    if (child.isObject3D) {
      parentInstance.remove(child);
    } else {
      child.parent = null;
      parentInstance.__objects = parentInstance.__objects.filter(
        x => x !== child
      ); // Remove attachment

      if (child.attach) parentInstance[child.attach] = null;
      else if (child.attachArray)
        parentInstance[child.attachArray] = parentInstance[
          child.attachArray
        ].filter(x => x !== child);
      else if (child.attachObject) {
        delete parentInstance[child.attachObject[0]][child.attachObject[1]];
      }
    }

    invalidateInstance(child);
    unstable_runWithPriority(unstable_IdlePriority, () => {
      // Remove interactivity
      if (child.__container)
        child.__container.__interaction = child.__container.__interaction.filter(
          x => x !== child
        ); // Remove nested child objects

      removeRecursive(child.__objects, child);
      removeRecursive(child.children, child, true); // Dispose item

      if (child.dispose) child.dispose(); // Remove references

      delete child.__container;
      delete child.__objects;
    });
  }
}

function switchInstance(instance, type, newProps, fiber) {
  const parent = instance.parent;
  const newInstance = createInstance(type, newProps, instance.__container);
  removeChild(parent, instance);
  appendChild(parent, newInstance); // This evil hack switches the react-internal fiber node
  // https://github.com/facebook/react/issues/14983
  // https://github.com/facebook/react/pull/15021
  [fiber, fiber.alternate].forEach(fiber => {
    if (fiber !== null) {
      fiber.stateNode = newInstance;

      if (fiber.ref) {
        if (typeof fiber.ref === 'function') fiber.ref(newInstance);
        else fiber.ref.current = newInstance;
      }
    }
  });
}

const Renderer = Reconciler({
  now: unstable_now,
  createInstance,
  removeChild,
  appendChild,
  insertBefore,
  supportsMutation: true,
  isPrimaryRenderer: false,
  // @ts-ignore
  schedulePassiveEffects: unstable_scheduleCallback,
  cancelPassiveEffects: unstable_cancelCallback,
  appendInitialChild: appendChild,
  appendChildToContainer: appendChild,
  removeChildFromContainer: removeChild,
  insertInContainerBefore: insertBefore,

  commitUpdate(instance, updatePayload, type, oldProps, newProps, fiber) {
    if (
      instance.__instance &&
      newProps.object &&
      newProps.object !== instance
    ) {
      // <instance object={...} /> where the object reference has changed
      switchInstance(instance, type, newProps, fiber);
    } else if (instance.isObject3D) {
      // Common Threejs scene object
      applyProps(instance, newProps, oldProps, true);
    } else {
      // This is a data object, let's extract critical information about it
      const _newProps$args = newProps.args,
        argsNew = _newProps$args === void 0 ? [] : _newProps$args,
        restNew = _objectWithoutPropertiesLoose(newProps, ['args']);

      const _oldProps$args = oldProps.args,
        argsOld = _oldProps$args === void 0 ? [] : _oldProps$args,
        restOld = _objectWithoutPropertiesLoose(oldProps, ['args']); // If it has new props or arguments, then it needs to be re-instanciated

      const hasNewArgs = argsNew.some((value, index) =>
        is.obj(value)
          ? Object.entries(value).some(_ref3 => {
              let key = _ref3[0],
                val = _ref3[1];
              return val !== argsOld[index][key];
            })
          : value !== argsOld[index]
      );

      if (hasNewArgs) {
        // Next we create a new instance and append it again
        switchInstance(instance, type, newProps, fiber);
      } else {
        // Otherwise just overwrite props
        applyProps(instance, restNew, restOld, true);
      }
    }
  },

  hideInstance(instance) {
    if (instance.isObject3D) {
      instance.visible = false;
      invalidateInstance(instance);
    }
  },

  unhideInstance(instance, props) {
    if ((instance.isObject3D && props.visible == null) || props.visible) {
      instance.visible = true;
      invalidateInstance(instance);
    }
  },

  getPublicInstance(instance) {
    return instance;
  },

  getRootHostContext() {
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  createTextInstance() {},

  finalizeInitialChildren() {
    return false;
  },

  prepareUpdate() {
    return emptyObject;
  },

  shouldDeprioritizeSubtree() {
    return false;
  },

  prepareForCommit() {},

  resetAfterCommit() {},

  shouldSetTextContent() {
    return false;
  },
});
function render(element, container, state) {
  let root = roots.get(container);

  if (!root) {
    container.__state = state;
    let newRoot = (root = Renderer.createContainer(container, false, false));
    roots.set(container, newRoot);
  }

  Renderer.updateContainer(element, root, null, () => undefined);
  return Renderer.getPublicRootInstance(root);
}
function unmountComponentAtNode(container) {
  const root = roots.get(container);
  if (root)
    Renderer.updateContainer(
      null,
      root,
      null,
      () => void roots.delete(container)
    );
}
const hasSymbol = typeof Symbol === 'function' && Symbol.for;
const REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
function createPortal(children, containerInfo, implementation, key) {
  if (key === void 0) {
    key = null;
  }

  return {
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : '' + key,
    children,
    containerInfo,
    implementation,
  };
}
Renderer.injectIntoDevTools({
  bundleType: process.env.NODE_ENV === 'production' ? 0 : 1,
  version: version,
  rendererPackageName: 'react-three-fiber',
  findHostInstanceByFiber: Renderer.findHostInstance,
});

function isOrthographicCamera(def) {
  return def.isOrthographicCamera;
}

function makeId(event) {
  return event.object.uuid + '/' + event.index;
}

const stateContext = createContext({});
const useCanvas = props => {
  const children = props.children,
    gl = props.gl,
    camera = props.camera,
    orthographic = props.orthographic,
    raycaster = props.raycaster,
    size = props.size,
    pixelRatio = props.pixelRatio,
    _props$vr = props.vr,
    vr = _props$vr === void 0 ? false : _props$vr,
    _props$shadowMap = props.shadowMap,
    shadowMap = _props$shadowMap === void 0 ? false : _props$shadowMap,
    _props$invalidateFram = props.invalidateFrameloop,
    invalidateFrameloop =
      _props$invalidateFram === void 0 ? false : _props$invalidateFram,
    _props$updateDefaultC = props.updateDefaultCamera,
    updateDefaultCamera =
      _props$updateDefaultC === void 0 ? true : _props$updateDefaultC,
    onCreated = props.onCreated,
    onPointerMissed = props.onPointerMissed,
    browser = props.browser;
  const useLayoutEffect$1 = browser ? useLayoutEffect : useEffect;
  let isReadyPrepared = false; // Local, reactive state

  const _useState = useState(false),
    ready = _useState[0],
    setReady = _useState[1];

  const _useState2 = useState(() => new Vector2()),
    mouse = _useState2[0];

  const _useState3 = useState(() => {
      const ray = new Raycaster();
      if (raycaster) applyProps(ray, raycaster, {});
      return ray;
    }),
    defaultRaycaster = _useState3[0];

  const _useState4 = useState(() => {
      const scene = new Scene();
      scene.__interaction = [];
      scene.__objects = [];
      return scene;
    }),
    defaultScene = _useState4[0];

  const _useState5 = useState(() => {
      const cam = orthographic
        ? new OrthographicCamera(0, 0, 0, 0, 0.1, 1000)
        : new PerspectiveCamera(75, 0, 0.1, 1000);
      cam.position.z = 5;
      if (camera) applyProps(cam, camera, {});
      return cam;
    }),
    defaultCam = _useState5[0],
    _setDefaultCamera = _useState5[1]; // Public state

  const state = useRef({
    ready: false,
    manual: false,
    vr: false,
    active: true,
    invalidateFrameloop: false,
    frames: 0,
    aspect: 0,
    subscribers: [],
    camera: defaultCam,
    scene: defaultScene,
    raycaster: defaultRaycaster,
    mouse,
    gl,
    captured: undefined,
    size: {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    },
    viewport: {
      width: 0,
      height: 0,
      factor: 0,
    },
    initialClick: [0, 0],
    initialHits: [],
    subscribe: fn => {
      state.current.subscribers.push(fn);
      return () =>
        (state.current.subscribers = state.current.subscribers.filter(
          s => s !== fn
        ));
    },
    setManual: takeOverRenderloop => {
      state.current.manual = takeOverRenderloop;

      if (takeOverRenderloop) {
        // In manual mode items shouldn't really be part of the internal scene which has adverse effects
        // on the camera being unable to update without explicit calls to updateMatrixWorl()
        state.current.scene.children.forEach(child =>
          state.current.scene.remove(child)
        );
      }
    },
    setDefaultCamera: camera => _setDefaultCamera(camera),
    invalidate: () => invalidate(state),
    intersect: event => handlePointerMove(event || {}),
  }); // This is used as a clone of the current state, to be distributed through context and useThree

  const sharedState = useRef(state.current); // Writes locals into public state for distribution among subscribers, context, etc

  useLayoutEffect$1(() => {
    state.current.ready = ready;
    state.current.size = size;
    state.current.camera = defaultCam;
    state.current.invalidateFrameloop = invalidateFrameloop;
    state.current.vr = vr;
    state.current.gl = gl;
  }, [invalidateFrameloop, vr, ready, size, defaultCam, gl]);
  useLayoutEffect$1(() => {
    if (gl) {
      // Start render-loop, either via RAF or setAnimationLoop for VR
      if (!state.current.vr) {
        invalidate(state);
      } else {
        gl.vr.enabled = true;
        gl.setAnimationLoop(t => {
          renderGl(state, t, 0, true);
        });
      }
    }
  }, [gl]); // Manage renderer

  useLayoutEffect$1(() => {
    // Dispose renderer on unmount
    return () => {
      if (gl) {
        gl.forceContextLoss();
        gl.dispose();
        state.current.gl = undefined;
        state.current.active = false;
        unmountComponentAtNode(state.current.scene);
      }
    };
  }, []); // Update pixel ratio

  useLayoutEffect$1(() => {
    if (pixelRatio && gl) gl.setPixelRatio(pixelRatio);
  }, [pixelRatio, gl]); // Adjusts default camera

  useLayoutEffect$1(() => {
    state.current.aspect = size.width / size.height || 0;

    if (isOrthographicCamera(state.current.camera)) {
      state.current.viewport = {
        width: size.width,
        height: size.height,
        factor: 1,
      };
    } else {
      const target = new Vector3(0, 0, 0);
      const distance = state.current.camera.position.distanceTo(target);
      const fov = MathUtils.degToRad(state.current.camera.fov); // convert vertical fov to radians

      
      const height = 2 * Math.tan(fov / 2) * distance; // visible height

      const width = height * state.current.aspect;
      state.current.viewport = {
        width,
        height,
        factor: size.width / width,
      };
    }

    if (ready && size.width) {
      if (gl) {
        gl.setSize(size.width, size.height);
        gl.setClearAlpha(0);

        if (shadowMap) {
          if (typeof shadowMap === 'object') {
            gl.shadowMap.enabled = true;
            Object.assign(gl, shadowMap);
          } else {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = PCFSoftShadowMap;
          }
        }
      }
      /* https://github.com/drcmda/react-three-fiber/issues/92
          Sometimes automatic default camera adjustment isn't wanted behaviour */

      if (updateDefaultCamera) {
        if (isOrthographicCamera(state.current.camera)) {
          state.current.camera.left = size.width / -2;
          state.current.camera.right = size.width / 2;
          state.current.camera.top = size.height / 2;
          state.current.camera.bottom = size.height / -2;
        } else {
          state.current.camera.aspect = state.current.aspect; // TODO: Why radius??
          // state.current.camera.radius = (size.width + size.height) / 4
        }

        state.current.camera.updateProjectionMatrix();
      }

      invalidate(state);
    } // Only trigger the context provider when necessary

    sharedState.current = _extends({}, state.current);
  }, [ready, size, defaultCam, updateDefaultCamera, gl]); // This component is a bridge into the three render context, when it gets rendererd
  // we know we are ready to compile shaders, call subscribers, etc

  const IsReady = useCallback(() => {
    const activate = useCallback(
      () => void (setReady(true), invalidate(state)),
      []
    );
    useEffect(() => {
      if (onCreated) {
        const result = onCreated(state.current);
        if (result && result.then) return void result.then(activate);
      }

      activate();
    }, []);
    return null;
  }, []); // Render v-dom into scene

  useLayoutEffect$1(() => {
    if (!isReadyPrepared && gl && size.width && size.height) {
      render(
        createElement(
          stateContext.Provider,
          {
            value: sharedState.current,
          },
          createElement(IsReady, null),
          typeof children === 'function' ? children(state.current) : children
        ),
        state.current.scene,
        state
      );
      isReadyPrepared = true;
    }
  }, [gl, size]);
  /** Sets up defaultRaycaster */

  const prepareRay = useCallback(event => {
    if (event.clientX !== void 0) {
      const left = state.current.size.left || 0;
      const right = left + state.current.size.width || 0;
      const top = size.top || 0;
      const bottom = top + state.current.size.height || 0;
      const x = ((event.clientX - left) / (right - left)) * 2 - 1;
      const y = -((event.clientY - top) / (bottom - top)) * 2 + 1;
      mouse.set(x, y);
      defaultRaycaster.setFromCamera(mouse, state.current.camera);
    }
  }, []);
  /** Intersects interaction objects using the event input */

  const intersect = useCallback(function(event, prepare) {
    if (prepare === void 0) {
      prepare = true;
    }

    if (prepare) prepareRay(event);
    const seen = new Set();
    const hits = []; // Intersect known handler objects and filter against duplicates

    const intersects = defaultRaycaster
      .intersectObjects(state.current.scene.__interaction, true)
      .filter(item => {
        const id = makeId(item);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    for (let intersect of intersects) {
      let receivingObject = intersect.object;
      let object = intersect.object; // Bubble event up

      while (object) {
        if (object.__handlers)
          hits.push(
            _extends({}, intersect, {
              object,
              receivingObject,
            })
          );
        object = object.parent;
      }
    }

    return hits;
  }, []);
  /**  Handles intersections by forwarding them to handlers */

  const handleIntersects = useCallback((event, fn) => {
    prepareRay(event); // If the interaction is captured, take the last known hit instead of raycasting again

    const hits =
      state.current.captured && event.type !== 'click' && event.type !== 'wheel'
        ? state.current.captured
        : intersect(event, false);

    if (hits.length) {
      const unprojectedPoint = new Vector3(mouse.x, mouse.y, 0).unproject(
        state.current.camera
      );

      for (let hit of hits) {
        let stopped = {
          current: false,
        };
        fn(
          _extends({}, event, hit, {
            stopped,
            unprojectedPoint,
            ray: defaultRaycaster.ray,
            // Hijack stopPropagation, which just sets a flag
            stopPropagation: () => (stopped.current = true),
            sourceEvent: event,
          })
        );
        if (stopped.current === true) break;
      }
    }

    return hits;
  }, []);
  const handlePointer = useCallback(
    name => event => {
      if (!state.current.ready) return; // Collect hits

      const hits = handleIntersects(event, data => {
        const object = data.object;
        const handlers = object.__handlers;

        if (handlers && handlers[name]) {
          // Forward all events back to their respective handlers with the exception of click,
          // which must must the initial target
          if (name !== 'click' || state.current.initialHits.includes(object))
            handlers[name](data);
        }
      }); // If a click yields no results, pass it back to the user as a miss

      if (name === 'pointerDown') {
        state.current.initialClick = [event.clientX, event.clientY];
        state.current.initialHits = hits.map(hit => hit.object);
      }

      if (name === 'click' && !hits.length && onPointerMissed) {
        let dx = event.clientX - state.current.initialClick[0];
        let dy = event.clientY - state.current.initialClick[1];
        let distance = Math.round(Math.sqrt(dx * dx + dy * dy));
        if (distance <= 2) onPointerMissed();
      }
    },
    [onPointerMissed]
  );
  const hovered = new Map();
  const handlePointerMove = useCallback(event => {
    if (!state.current.ready) return;
    const hits = handleIntersects(event, data => {
      const object = data.object;
      const handlers = object.__handlers; // Check presence of handlers

      if (!handlers) return; // Call mouse move

      if (handlers.pointerMove) handlers.pointerMove(data); // Check if mouse enter or out is present

      if (handlers.pointerOver || handlers.pointerOut) {
        const id = makeId(data);
        const hoveredItem = hovered.get(id);

        if (!hoveredItem) {
          // If the object wasn't previously hovered, book it and call its handler
          hovered.set(id, data);
          if (handlers.pointerOver)
            handlers.pointerOver(
              _extends({}, data, {
                type: 'pointerover',
              })
            );
        } else if (hoveredItem.stopped.current) {
          // If the object was previously hovered and stopped, we shouldn't allow other items to proceed
          data.stopPropagation(); // In fact, wwe can safely remove them from the cache

          Array.from(hovered.values()).forEach(data => {
            const checkId = makeId(data);

            if (checkId !== id) {
              if (data.object.__handlers.pointerOut)
                data.object.__handlers.pointerOut(
                  _extends({}, data, {
                    type: 'pointerout',
                  })
                );
              hovered.delete(checkId);
            }
          });
        }
      }
    }); // Take care of unhover

    handlePointerCancel(event, hits);
    return hits;
  }, []);
  const handlePointerCancel = useCallback((event, hits) => {
    if (!hits) hits = handleIntersects(event, () => null);
    Array.from(hovered.values()).forEach(data => {
      if (hits && (!hits.length || !hits.find(i => i.object === data.object))) {
        const object = data.object;
        const handlers = object.__handlers;
        if (handlers && handlers.pointerOut)
          handlers.pointerOut(
            _extends({}, data, {
              type: 'pointerout',
            })
          );
        hovered.delete(makeId(data));
      }
    });
  }, []);
  return {
    pointerEvents: {
      onClick: handlePointer('click'),
      onWheel: handlePointer('wheel'),
      onPointerDown: handlePointer('pointerDown'),
      onPointerUp: handlePointer('pointerUp'),
      onPointerLeave: e => handlePointerCancel(e, []),
      onPointerMove: handlePointerMove,
      onGotPointerCapture: e => (state.current.captured = intersect(e, false)),
      onLostPointerCapture: e => (
        (state.current.captured = undefined), handlePointerCancel(e)
      ),
    }, // anything else we might want to return?
  };
};

function useRender(fn, takeOverRenderloop, deps) {
  if (takeOverRenderloop === void 0) {
    takeOverRenderloop = false;
  }

  if (deps === void 0) {
    deps = [];
  }

  const _useContext = useContext(stateContext),
    subscribe = _useContext.subscribe,
    setManual = _useContext.setManual; // This calls into the host to inform it whether the render-loop is manual or not

  useMemo(() => takeOverRenderloop && setManual(true), [takeOverRenderloop]);
  useEffect(() => {
    // Subscribe to the render-loop
    const unsubscribe = subscribe(fn);
    return () => {
      // Call subscription off on unmount
      unsubscribe();
      if (takeOverRenderloop) setManual(false);
    };
  }, deps);
}
/** experimental */

function useFrame(fn, deps) {
  if (deps === void 0) {
    deps = [];
  }

  useRender(fn, false, deps);
}
/** experimental */

function useGl(fn, deps) {
  if (deps === void 0) {
    deps = [];
  }

  useRender(fn, true, deps);
}
function useThree() {
  const _useContext2 = useContext(stateContext),
    subscribe = _useContext2.subscribe,
    props = _objectWithoutPropertiesLoose(_useContext2, ['subscribe']);

  return props;
}
function useUpdate(callback, dependents, optionalRef) {
  const _useContext3 = useContext(stateContext),
    invalidate = _useContext3.invalidate;

  const localRef = useRef();
  const ref = optionalRef ? optionalRef : localRef;
  useEffect(() => {
    if (ref.current) {
      callback(ref.current);
      invalidate();
    }
  }, dependents);
  return ref;
}
function useResource(optionalRef) {
  const _useState = useState(),
    resource = _useState[0],
    set = _useState[1];

  const localRef = useRef(undefined);
  const ref = optionalRef ? optionalRef : localRef;
  useEffect(() => void set(ref.current), [ref.current]);
  return [ref, resource];
}

/** experimental */
function useLoader(proto, url, extensions) {
  const key = useMemo(() => ({}), [url]);

  const _useState2 = useState(() => new WeakMap()),
    cache = _useState2[0];

  const loader = useMemo(() => {
    const temp = new proto();
    if (extensions) extensions(temp);
    return temp;
  }, [proto]);

  const _useState3 = useState(false),
    _ = _useState3[0],
    forceUpdate = _useState3[1];

  useEffect(() => {
    if (!cache.has(key)) {
      loader.load(url, gltf => {
        const temp = [];
        gltf.scene.traverse(
          obj =>
            obj.isMesh &&
            temp.push({
              geometry: obj.geometry,
              material: obj.material,
            })
        );
        cache.set(key, temp);
        forceUpdate(i => !i);
      });
    }
  }, [proto, key]);
  return cache.get(key) || [];
}

const apply = objects => {
  console.warn(
    'react-three-fiber: Please use extend ✅ instead of apply ❌, the former will be made obsolete soon!'
  );
  extend(objects);
};

function clientXY(e) {
  e.clientX = e.nativeEvent.pageX;
  e.clientY = e.nativeEvent.pageY;
  return e;
}

const Canvas = memo(props => {
  const _useState = useState(),
    gl = _useState[0],
    setGl = _useState[1];

  const _useState2 = useState(),
    glContext = _useState2[0],
    setGlContext = _useState2[1];

  const _useState3 = useState(props.pixelRatio || 1),
    pixelRatio = _useState3[0],
    setPixelRatio = _useState3[1];

  const _useState4 = useState({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    }),
    size = _useState4[0],
    setSize = _useState4[1];

  const _useCanvas = useCanvas(
      _extends({}, props, {
        size,
        pixelRatio,
        gl,
      })
    ),
    pointerEvents = _useCanvas.pointerEvents;

  const _useState5 = useState(() =>
      PanResponder.create({
        onStartShouldSetPanResponder() {
          return true;
        },

        onStartShouldSetPanResponderCapture(e) {
          pointerEvents.onGotPointerCapture(clientXY(e));
          return true;
        },

        onMoveShouldSetPanResponder() {
          return true;
        },

        onMoveShouldSetPanResponderCapture() {
          return true;
        },

        onPanResponderTerminationRequest() {
          return true;
        },

        onPanResponderStart: e => pointerEvents.onPointerDown(clientXY(e)),
        onPanResponderMove: e => pointerEvents.onPointerMove(clientXY(e)),
        onPanResponderEnd: e => pointerEvents.onPointerUp(clientXY(e)),
        onPanResponderRelease: e => pointerEvents.onPointerLeave(clientXY(e)),
        onPanResponderTerminate: e =>
          pointerEvents.onLostPointerCapture(clientXY(e)),
        onPanResponderReject: e =>
          pointerEvents.onLostPointerCapture(clientXY(e)),
      })
    ),
    panResponder = _useState5[0];

  useEffect(() => {
    // Wait for ExpoGL Context and onLayout callback
    if (!gl && glContext && pixelRatio && size.width && size.height) {
      const renderer = new Renderer$1({
        gl: glContext,
        width: size.width / pixelRatio,
        height: size.height / pixelRatio,
        pixelRatio,
      }); // Bind previous render method to Renderer

      const rendererRender = renderer.render.bind(renderer);

      renderer.render = (scene, camera) => {
        rendererRender(scene, camera); // End frame through the RN Bridge

        glContext.endFrameEXP();
      };

      renderer.setClearAlpha(0);
      setGl(renderer);
    }
  }, [glContext, size, pixelRatio]);

  function onLayout(e) {
    const _e$nativeEvent$layout = e.nativeEvent.layout,
      width = _e$nativeEvent$layout.width,
      height = _e$nativeEvent$layout.height,
      x = _e$nativeEvent$layout.x,
      y = _e$nativeEvent$layout.y;
    setSize({
      width,
      height,
      top: y,
      left: x,
    });
    if (!props.pixelRatio) setPixelRatio(PixelRatio.get());
  }

  return createElement(
    GLView,
    _extends({}, panResponder.panHandlers, {
      onContextCreate: setGlContext,
      onLayout: onLayout,
      style: _extends(
        {
          flex: 1,
        },
        props.style
      ),
    })
  );
});

export {
  Canvas,
  addEffect,
  apply,
  applyProps,
  createPortal,
  extend,
  invalidate,
  render,
  unmountComponentAtNode,
  useFrame,
  useGl,
  useLoader,
  useRender,
  useResource,
  useThree,
  useUpdate,
};



