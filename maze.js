const size = 5
const mazeContainer = document.querySelector(".maze")
const solveButton = document.querySelector("#solve-button")
const getBtn = document.querySelector("#fetch")


mazeContainer.innerHTML = createMaze(size)

var env = null
var maze = null
var start = null
var target = null
var currentMaze = null

//import {Agent} from './agent.js'
var directionPolicy = {
    "0": [0, 1, 2, 3],
    "1": [1, 0, 3, 2],
    "2": [3, 2, 0, 1],
    "3": [2, 3, 1, 0]
}
//var host = "http://thao-nguyen-the.lovestoblog.com/"
var host = "http://localhost:81/"

var api = host + "maze/api/init-maze.php?id="

function fetchMaze(api) {
    fetch(api)
        .then((data) => data.json())
        .then((data) => {
            if (data['result'] === true) {
                const startStr = data['beg_pos']
                const endStr = data['end_pos']
                start = new Array(2)
                start[0] = parseInt(startStr[0])
                start[1] = parseInt(startStr[1])
                target = new Array(2)
                target[0] = parseInt(endStr[0])
                target[1] = parseInt(endStr[1])
                //console.log(start, target)
                currentMaze = stringToMaze(data['current_maze'])
                arrayToMaze(currentMaze)
                drawStart()
                drawEnd()
            }
        }).catch(()=>{})
}

function drawStart() {
    const grids = document.querySelectorAll(".maze-row > .maze-grid") 
    let [start_x, start_y] = start
    grids.forEach((grid)=> {
        if (grid.classList.contains(`js-grid-${start_x}-${start_y}`)) {
            grid.classList.add("start-grid")
        } else {
            grid.classList.remove("start-grid")
        }
    })
}

function drawEnd() {
    const grids = document.querySelectorAll(".maze-row > .maze-grid") 
    let [end_x, end_y] = target
    grids.forEach((grid)=> {
        if (grid.classList.contains(`js-grid-${end_x}-${end_y}`)) {
            grid.classList.add("end-grid")
        } else {
            grid.classList.remove("end-grid")
        }
    })
}

function stringToMaze(data) {
    let maze = creatZeroArray(size)
    for (let i=0; i<size; i++) {
        for (let j=0; j<size; j++) {
            for (let z=0; z<4; z++) {
                let index = i * (size * 4) + j * 4 + z 
                maze[i][j][z] = parseInt(data[index])
            }
        }
    }
    return maze
}


function mazeToString(maze) {
    let result = ""

    for (let i=0; i<maze.length; i++) {
        for (let j=0; j<maze[i].length; j++) {
            for (let z=0; z<maze[i][j].length; z++) {
                result += maze[i][j][z]
            }
        }
    }
    return result
}


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


function createMaze (size) {
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


function arrayToMaze(curMaze) {
    const walls = [...Array.from(document.querySelectorAll(".maze-row > .maze-wall")), ...Array.from(document.querySelectorAll(".maze-wall-row > .maze-grid"))]
    walls.forEach((wall)=> {wall.classList.add("maze-wall--active")})

    for (let i=0; i<size; i++) {
        for (let j=0; j<size; j++) {
            if (curMaze[i][j][0] === 1) {
                let wall = document.querySelector(`.js-wall-hori-up-${i}-${j}`)
                if (wall?.classList) {
                    wall.classList.remove("maze-wall--active")
                }
            } 
            if (curMaze[i][j][1] === 1) {
                let wall = document.querySelector(`.js-wall-hori-down-${i}-${j}`)
                if (wall?.classList) {
                    wall.classList.remove("maze-wall--active")
                }
            } 
            if (curMaze[i][j][2] === 1) {
                let wall = document.querySelector(`.js-wall-verti-left-${i}-${j}`)
                if (wall?.classList) {
                    wall.classList.remove("maze-wall--active")
                }
            } 
            if (curMaze[i][j][3] === 1) {
                let wall = document.querySelector(`.js-wall-verti-rigth-${i}-${j}`)
                if (wall?.classList) {
                    wall.classList.remove("maze-wall--active")
                }
            } 
        }
    } 
}


const walls = document.querySelectorAll(".maze-row > .maze-wall, .maze-wall-row > .maze-grid")
const grids = document.querySelectorAll(".maze-row>.maze-grid")
const controller = document.querySelector(".controller")
const startButton = document.querySelector("#start-button")
const endButton = document.querySelector("#end-button")
const getMazeButton = document.querySelector("#get-maze-button")


getMazeButton.addEventListener("click", ()=>{
    maze = convertToArray(size)
    for (let grid of grids) {
        grid.classList.remove("path")
    }
    env = new Environment(maze, start, target)
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
            target = [parseInt(str[str.length - 3]), parseInt(str[str.length - 1])]
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


function getAction (valueFunc, x, y, direction) {
    let value = new Array(4).fill(0)
    let attachValue = new Array(4).fill(0)
    
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

    for (let i=0; i<4; i++) {
        attachValue[i] = value[directionPolicy[`${direction}`][i]]
    }

    return [maxArray(value), maxArray(attachValue)]
}


const test = function (valueFunc) {
    let command = ""
    let direction = 1
    let [x, y] = env.reset()
    let done = false
    let index = 0
    let path = ""

    while (!done) {
        let [action, attachValue] = getAction(valueFunc, x, y, direction)
        if (action === 0) {
            path += "U"
        } else if (action === 1) {
            path += "D"
        } else if (action === 2) {
            path += "L"
        } else {
            path += "R"
        }
        let [[next_x, next_y], reward, newDone] = env.step(action)
        let ele = env.getElement(next_x, next_y)
        if (!newDone) {
            ele.classList.add("path")
        }
        x = next_x
        y = next_y
        done = newDone
        index ++
        if (index === 1000) {
            break
        }
    }

    return path
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
                if (i == target[0] && j == target[1]) {
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
    const path = test(valueFunc)

    const current = "test"
    const startStr = `${start[0]}${start[1]}`
    const endStr = `${target[0]}${target[1]}`

    fetch(host + `maze/api/get-maze.php?current-maze=${mazeToString(maze)}&path=${path}&start=${startStr}&end=${endStr}`, {mode: 'no-cors', method:'get'})
    .then(function(response) {
    }).catch(()=> {console.log("Error")})
})


getBtn.addEventListener("click", (e)=> {
    fetchMaze(`${api}${e.target.parentNode.querySelector("#maze-id").value}`)
})

document.addEventListener("keydown", (e)=> {
    console.log(e)
    if (e.keyCode === 13) {
        fetchMaze(`${api}${e.target.parentNode.querySelector("#maze-id").value}`)
    }
})
