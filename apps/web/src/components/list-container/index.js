import React, { useEffect, useMemo, useRef } from "react";
import { Flex } from "rebass";
import Button from "../button";
import * as Icon from "../icons";
import { Virtuoso } from "react-virtuoso";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import GroupHeader from "../group-header";
import ListProfiles from "../../common/list-profiles";
import { CustomScrollbarsVirtualList } from "../scroll-container";
import ReminderBar from "../reminder-bar";
import Announcements from "../announcements";
import useAnnouncements from "../../utils/use-announcements";

function ListContainer(props) {
  const { type, groupType, items, context, refresh, header } = props;
  const [announcements, removeAnnouncement] = useAnnouncements();
  const profile = useMemo(() => ListProfiles[type], [type]);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const listRef = useRef();
  const focusedItemIndex = useRef(-1);
  const listContainerRef = useRef();

  useEffect(() => {
    if (shouldSelectAll && window.currentViewKey === type)
      setSelectedItems(items.filter((item) => item.type !== "header"));
  }, [shouldSelectAll, type, setSelectedItems, items]);

  return (
    <Flex variant="columnFill">
      {!props.items.length && props.placeholder ? (
        <>
          {header}
          <Flex variant="columnCenterFill">
            {props.isLoading ? <Icon.Loading rotate /> : <props.placeholder />}
          </Flex>
        </>
      ) : (
        <>
          <Flex
            ref={listContainerRef}
            variant="columnFill"
            data-test-id="note-list"
            onFocus={(e) => {
              if (e.target.parentElement.dataset.index) {
                focusedItemIndex.current = parseInt(
                  e.target.parentElement.dataset.index
                );
              }
            }}
          >
            <Virtuoso
              ref={listRef}
              data={items}
              computeItemKey={(index) => items[index].id || items[index].title}
              defaultItemHeight={profile.estimatedItemHeight}
              totalCount={items.length}
              onKeyDown={(e) => {
                const isUp = e.code === "ArrowUp";
                const isDown = e.code === "ArrowDown";
                const isHeader = (i) => items && items[i]?.type === "header";
                const moveDown = (i) => (i < items.length - 1 ? ++i : 0);
                const moveUp = (i) => (i > 0 ? --i : items.length - 1);

                let i = focusedItemIndex.current;
                let nextIndex = i;

                if (nextIndex <= -1 && (isUp || isDown)) {
                  nextIndex = 0;
                }

                if (isUp) {
                  nextIndex = moveUp(i);
                  if (isHeader(nextIndex)) nextIndex = moveUp(nextIndex);
                } else if (isDown) {
                  nextIndex = moveDown(i);
                  if (isHeader(nextIndex)) nextIndex = moveDown(nextIndex);
                }

                if (isUp || isDown) {
                  listRef.current.scrollIntoView({
                    index: nextIndex,
                    behavior: "auto",
                  });
                  e.preventDefault();
                  const listItem = listContainerRef.current.querySelector(
                    `[data-item-index="${nextIndex}"]`
                  );
                  if (!listItem) return;
                  listItem.firstElementChild.focus();
                }
              }}
              // overscan={10}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Header: () =>
                  header ? (
                    header
                  ) : announcements.length ? (
                    <Announcements
                      announcements={announcements}
                      removeAnnouncement={removeAnnouncement}
                    />
                  ) : (
                    <ReminderBar />
                  ),
              }}
              itemContent={(index, item) => {
                if (!item) return null;

                switch (item.type) {
                  case "header":
                    return (
                      <GroupHeader
                        type={groupType}
                        refresh={refresh}
                        title={item.title}
                        index={index}
                        groups={props.items.filter((v) => v.type === "header")}
                        onJump={(title) => {
                          const index = props.items.findIndex(
                            (v) => v.title === title
                          );
                          if (index < 0) return;
                          listRef.current.scrollToIndex({
                            index,
                            align: "center",
                            behavior: "smooth",
                          });
                        }}
                      />
                    );
                  default:
                    return profile.item(index, item, groupType, context);
                }
              }}
            />
          </Flex>
        </>
      )}
      {props.button && (
        <Button
          variant="primary"
          testId={`${props.type}-action-button`}
          Icon={props.button.icon || Icon.Plus}
          content={props.button.content}
          onClick={props.button.onClick}
          show={props.button.show}
        />
      )}
    </Flex>
  );
}
export default ListContainer;
