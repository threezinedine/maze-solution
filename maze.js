const size = 5
const mazeContainer = document.querySelector(".maze")
const solveButton = document.querySelector("#solve-button")
var env = null
var maze = null
var start = null
var target = null

//import {Agent} from './agent.js'


class Agent {
    constructor(container, start) {
        this.container = container
        this.current = start
    }

    moveTo(coor_x, coor_y) {
        this.current.innerHTML = ""
        this.current = this.container.querySelector(`.js-grid-${coor_x}-${coor_y}`)
        this.current.innerHTML = "<div class='agent'></div>"
    } 
}


class Environment {
    constructor(policy, start, target) {
        this.policy = policy
        this.start = start
        this.target = target
        this.current = start
    }

    reset() {
        this.current = this.start
        return this.start
    }

    simulate(state, action) {
        const current = this.current
        this.current = state
        const [next_state, reward, done] = this.step(action)
        this.current = current
        return [next_state, reward, done]
    }

    step(action) {
        const [x, y] = this.current
        let [next_x, next_y] = this.current
        if (this.policy[x][y][action] === 1) {
            if (action == 0) {
                next_x --
            } else if (action == 1) {
                next_x ++
            } else if (action == 2) {
                next_y --
            } else {
                next_y ++
            }
        }
        this.current = [next_x, next_y]
        let done = false
        const [target_x, target_y] = this.target
        if (next_x === target_x && next_y === target_y) {
            done = true
        }
        return [this.current, -1, done]
    }

    getElement(x, y) {
        return document.querySelector(`.js-grid-${x}-${y}`)
    }
}


const initialPolicy  = function(size) {
    let result = new Array(size)

    for (let i=0; i<size; i++) {
        let row = new Array(size).fill(0)
        result[i] = row
    }
    return result
}

var valueFunc = initialPolicy(size)


const createMaze = function(size) {
    let result = ""
    for (let i=0; i<size; i++) {
        result += "\n<div class='maze-row'>"
        for (let j=0; j<size; j++) {
            result += `\n\t<div class='maze-grid js-grid-${i}-${j}'></div>`
            if (j != size - 1) {
                result += `\n\t<div class='maze-wall js-wall-verti-right-${i}-${j} js-wall-verti-left-${i}-${j+1}'></div>`
            }
        }  
        result += "\n</div>"

        if (i != size - 1) {
            result += "\n<div class='maze-wall-row'>"
            for (let j=0; j<size; j++) {
                result += `\n\t<div class='maze-grid js-wall-hori-down-${i}-${j} js-wall-hori-up-${i+1}-${j}'></div>`
                if (j != size - 1) {
                    result += "\n\t<div class='maze-wall'></div>"
                }
            }
            result += "\n</div>"
        }

    }
    return result
}

mazeContainer.innerHTML = createMaze(size)


const agent = new Agent(document, document.querySelector(".js-grid-0-0"))


const creatZeroArray = function(size) {
    let maze = new Array(size)

    for (let i=0; i<size; i++) {
        let row = new Array(size) 
        for (let j=0; j<size; j++) {
            let grid = new Array(4)
            for (let z=0; z<4; z++) {
                grid[z] = 0
            }
            row[j] = grid
        }
        maze[i] = row
    }

    return maze
}


const convertToArray = function (size) {
    // up, down, left, right
    let initMaze = creatZeroArray(size)
    for (let i=0; i<size; i++) {
        for (let j=0; j<size; j++) {
            if (j != 0) {
                const leftWall = document.querySelector(`.js-wall-verti-left-${i}-${j}`)
                if (!leftWall.classList.contains("maze-wall--active")) {
                    initMaze[i][j][2] = 1
                }
            }
            if (j != size - 1) {
                const rightWall = document.querySelector(`.js-wall-verti-right-${i}-${j}`)
                if (!rightWall.classList.contains("maze-wall--active")) {
                    initMaze[i][j][3] = 1
                }
            }
            if (i != 0) {
                const upWall = document.querySelector(`.js-wall-hori-up-${i}-${j}`)
                if (!upWall.classList.contains("maze-wall--active")) {
                    initMaze[i][j][0] = 1
                }
            }
            if (i != size-1) {
                const downWall = document.querySelector(`.js-wall-hori-down-${i}-${j}`)
                if (!downWall.classList.contains("maze-wall--active")) {
                    initMaze[i][j][1] = 1
                }
            }
        }
    } 
    return initMaze
}


const walls = document.querySelectorAll(".maze-row > .maze-wall, .maze-wall-row > .maze-grid")
const grids = document.querySelectorAll(".maze-row>.maze-grid")
const controller = document.querySelector(".controller")
const startButton = document.querySelector("#start-button")
const endButton = document.querySelector("#end-button")
const getMazeButton = document.querySelector("#get-maze-button")


getMazeButton.addEventListener("click", ()=>{
    maze = convertToArray(size)
    env = new Environment(maze, [0, 0], [size-1, size-1])
})



for (let wall of walls) {
    wall.addEventListener("click", (e) => {
        e.target.classList.toggle("maze-wall--active")
    })
}


for (let grid of grids) {
    grid.addEventListener("click", (e) => {
        if (startButton.classList.contains("btn--active")) {
            for (let grid of grids) {
                grid.classList.remove("start-grid")
            }
            e.target.classList.add("start-grid")
            let str = e.target.classList[1]
            start = [parseInt(str[str.length - 3]), parseInt(str[str.length - 1])]
        }
        else if (endButton.classList.contains("btn--active")) {
            for (let grid of grids) {
                grid.classList.remove("end-grid")
            }
            e.target.classList.add("end-grid")
            let str = e.target.classList[1]
            end = [parseInt(str[str.length - 3]), parseInt(str[str.length - 1])]
        }
    })
}


startButton.addEventListener("click", (e)=> {
    e.target.classList.toggle("btn--active")
})


endButton.addEventListener("click", (e) => {
    e.target.classList.toggle("btn--active")
})


function maxArray (arr) {
    let result = 0
    let best = arr[0]

    for (let i=0; i<arr.length; i++) {
        if (best < arr[i]) {
            result = i 
            best = arr[i]
        }
    }
    return result
}


function getAction (valueFunc, x, y) {
    let value = new Array(4).fill(0)
    
    if (x !== 0 && maze[x][y][0] === 1) {
        value[0] = valueFunc[x-1][y]
    } else {
        value[0] = -10000.
    }
    if (x !== size - 1 && maze[x][y][1] === 1) {
        value[1] = valueFunc[x+1][y]
    } else {
        value[1] = -10000.
    }
    if (y !== 0 && maze[x][y][2] === 1) {
        value[2] = valueFunc[x][y-1]
    } else {
        value[2] = -10000.
    }
    if (y !== size - 1 && maze[x][y][3] === 1) {
        value[3] = valueFunc[x][y+1]
    } else {
        value[3] = -10000.
    }

    return maxArray(value)
}


const test = function (valueFunc) {
    let [x, y] = env.reset()
    let done = false
    let index = 0

    while (!done) {
        action = getAction(valueFunc, x, y)
        let [[next_x, next_y], reward, newDone] = env.step(action)
        let ele = env.getElement(next_x, next_y)
        if (!newDone) {
            ele.classList.add("path")
        }
        x = next_x
        y = next_y
        done = newDone
        index ++
        if (index === 10) {
            break
        }
    }
}


solveButton.addEventListener("click", (e)=> {
    valueFunc = initialPolicy(size)
    const gamma = 0.99

    for (let episode=0; episode<300; episode++) {
        let delta = 0
        for (let i=0; i<size; i++) {
            for (let j=0; j<size; j++) {
                let oldValue = valueFunc[i][j]
                let newValue = 0
                for (let z=0; z<4; z++) {
                    const [[next_x, next_y], reward, done] = env.simulate([i, j], z)
                    if (!done) {
                        newValue += 0.25 * (reward + gamma * valueFunc[next_x][next_y]) 
                    } else {
                        newValue += 0.25
                    }
                }
                if (i == size-1 && j == size-1) {
                    valueFunc[i][j] = 0
                } else {
                    valueFunc[i][j] = newValue
                    delta += Math.abs(newValue - oldValue)
                }
            }
        }
        if (delta < 0.01) {
            break
        }
    }
    console.log(valueFunc)
    test(valueFunc)
})



